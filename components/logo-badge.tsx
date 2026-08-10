import Image from "next/image";

export function LogoBadge() {
    return (
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2">
                <Image src='/logo.svg' alt='logo' width={180} height={180}/>
            </div>
            <p className="logo-text">smashClub</p>
        </div>
    )
}
