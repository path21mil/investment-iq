import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
      <Image 
        src="/logo.png" 
        alt="Investment IQ Logo" 
        width={240} // You can adjust this number to make it wider/smaller
        height={60}  // You can adjust this to change the height
        className="object-contain"
        priority // Tells Next.js to load this instantly since it's above the fold
      />
    </Link>
  );
}