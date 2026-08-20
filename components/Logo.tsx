import Image from 'next/image';
import Link from 'next/link';

// We add an optional "className" so you can change the size from other files!
export default function Logo({ className = "w-40 md:w-[240px]" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center hover:opacity-80 transition-opacity ${className}`}>
      <Image 
        src="/Group 1.svg" 
        alt="Investment IQ Logo" 
        width={240} 
        height={60}
        // h-auto and w-full tell the image to perfectly fill whatever size the Link is
        className="object-contain w-full h-auto"
        priority 
      />
    </Link>
  );
}