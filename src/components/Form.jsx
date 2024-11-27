'use client';

import { useState } from "react"
import { Download } from "lucide-react"
import JSZip from 'jszip'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { useToast } from "@/hooks/use-toast"

export default function Form() {
    const [artistUrl, setArtistUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const { toast } = useToast()

    const downloadImages = async (releases) => {
        const zip = new JSZip();
        let completed = 0;

        try {
            const folder = zip.folder("releases");
            
            for (const release of releases) {
                try {
                    const response = await fetch(release.imageUrl);
                    if (!response.ok) throw new Error(`Failed to fetch ${release.name}`);
                    
                    const blob = await response.blob();
                    const sanitizedName = `${release.name} (${release.releaseDate}).jpg`;
                    folder.file(sanitizedName, blob);
                    
                    completed++;
                    setDownloadProgress(Math.round((completed / releases.length) * 100));
                } catch (error) {
                    console.error(`Error downloading ${release.name}:`, error);
                    toast({
                        title: "Error",
                        description: `Failed to download ${release.name}`,
                        variant: "destructive",
                    });
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${releases[0].artists} - Releases.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: "Success",
                description: `Downloaded ${completed} of ${releases.length} releases`,
            });
        } catch (error) {
            console.error('Error creating zip:', error);
            toast({
                title: "Error",
                description: "Failed to create zip file",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setDownloadProgress(0);
        
        try {
            if (!artistUrl.includes('open.spotify.com/artist/')) {
                throw new Error('Invalid Spotify artist URL');
            }

            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ artistUrl }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch releases');
            }

            const data = await response.json();
            
            toast({
                title: "Starting Download",
                description: `Downloading ${data.totalReleases} releases for ${data.artistName}...`,
            });

            await downloadImages(data.releases);
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to process request",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center flex-1 p-4 sm:p-24">
            <form 
                className="w-full max-w-md space-y-4"
                onSubmit={handleSubmit}
            >
            <div className="flex items-center gap-2 w-full">
                <Input 
                    type="text" 
                    placeholder="insert Spotify artist URL" 
                    className="flex-1"
                    value={artistUrl}
                    onChange={(e) => setArtistUrl(e.target.value)}
                    required
                    disabled={loading}
                />
                <HoverCard>
                    <HoverCardTrigger>
                        <div className="inline-flex items-center justify-center rounded-3xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                            ?
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                        <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold">On the artist profile:</h4>
                                <p className="text-sm">
                                    1. Click on the three dots next to the artist's name, album, or song title.
                                    <br/>
                                    2. Click on "Share."
                                    <br/>
                                    3. In the second menu, click on "Copy Spotify URL."
                                </p>
                            </div>
                        </div>
                    </HoverCardContent>
                </HoverCard>
            </div>
            
            <Button 
                className="w-full" 
                variant="outline"
                type="submit"
                disabled={loading}
            >
                <Download className="mr-2" /> 
                {loading 
                    ? `downloading... ${downloadProgress}%`
                    : 'download all images'
                }
            </Button>
        </form>
    </div>
    );
}