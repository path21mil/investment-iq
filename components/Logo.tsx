import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      <Image 
        src="/Group 1.svg" 
        alt="Investment IQ Logo" 
        width={240} 
        height={60}  
        className="object-contain"
        priority 
      />
    </Link>
  );
}