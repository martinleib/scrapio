import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

export default function Form() {
    return (
        <form className="flex flex-col items-center justify-center p-5 w-1/2 ml-auto mr-auto">
            <div className="flex items-center gap-2">
                <Input type="text" placeholder="insert artist spotify url" className="w-80"/>
                <HoverCard>
                    <HoverCardTrigger asChild>
                        <Button variant="outline">?</Button>
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
        </form>
    );
}