import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function getAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }
    
    const data = await response.json();
    return data.access_token;
}

async function getArtistReleases(accessToken, artistUrl) {
    try {
        const artistId = artistUrl.split('/artist/')[1].split('?')[0];
        
        const response = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to fetch artist releases: ${error}`);
        }
        
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error in getArtistReleases:', error);
        throw error;
    }
}

async function getArtistInfo(accessToken, artistId) {
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch artist info: ${error}`);
    }
    
    return await response.json();
}

export async function POST(request) {
    try {
        const { artistUrl } = await request.json();
        
        if (!artistUrl) {
            return NextResponse.json(
                { error: 'Artist URL is required' },
                { status: 400 }
            );
        }

        if (!CLIENT_ID || !CLIENT_SECRET) {
            console.error('Missing environment variables:', {
                hasClientId: !!CLIENT_ID,
                hasClientSecret: !!CLIENT_SECRET
            });
            return NextResponse.json(
                { error: 'Missing Spotify API credentials' },
                { status: 500 }
            );
        }

        const accessToken = await getAccessToken();
        const releases = await getArtistReleases(accessToken, artistUrl);
        
        const artistId = artistUrl.split('/artist/')[1].split('?')[0];
        const artistInfo = await getArtistInfo(accessToken, artistId);
        
        const formattedReleases = releases.map(release => ({
            name: release.name.replace(/[/\\?%*:|"<>]/g, '-'), // sanitize filename
            imageUrl: release.images[0]?.url,
            releaseDate: release.release_date,
            type: release.album_type,
            artists: release.artists.map(artist => artist.name).join(', ')
        }));

        return NextResponse.json({ 
            releases: formattedReleases,
            artistName: artistInfo.name,
            totalReleases: formattedReleases.length
        });
        
    } catch (error) {
        console.error('API Error:', {
            message: error.message,
            stack: error.stack,
            url: artistUrl
        });
        return NextResponse.json(
            { error: `Failed to fetch artist releases: ${error.message}` },
            { status: 500 }
        );
    }
}