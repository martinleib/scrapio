import JSZip from 'jszip';

export async function downloadImages(releases, setDownloadProgress, toast) {
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
}