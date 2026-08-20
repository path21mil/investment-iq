import Image from 'next/image';
import Link from 'next/link';

// We added 'href' here, defaulting to "/"
export default function Logo({ 
  className = "w-40 md:w-[240px]", 
  href = "/" 
}: { 
  className?: string, 
  href?: string 
}) {
  return (
    <Link href={href} className={`flex items-center hover:opacity-80 transition-opacity ${className}`}>
      <Image 
        src="/Group 1.svg" 
        alt="Investment IQ Logo" 
        width={240} 
        height={60}
        className="object-contain w-full h-auto"
        priority 
      />
    </Link>
  );
}