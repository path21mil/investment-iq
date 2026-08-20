import Image from 'next/image';
import Link from 'next/link';

export default function Logo({ 
  className = "w-40 md:w-[240px]", 
  href = "/",
  theme = "light" // ✨ 1. Add the theme prop with a default
}: { 
  className?: string, 
  href?: string,
  theme?: "light" | "dark" // ✨ 2. Define the exact types allowed
}) {

  // ✨ 3. Dynamically choose the image source!
  // If theme is dark, use the white-text logo. Otherwise, use the standard one.
  const imageSrc = theme === "dark" ? "/Group 1-dark.svg" : "/Group 1.svg";

  return (
    <Link href={href} className={`flex items-center hover:opacity-80 transition-opacity ${className}`}>
      <Image 
        src={imageSrc} 
        alt="Investment IQ Logo" 
        width={240} 
        height={60}
        className="object-contain w-full h-auto"
        priority 
      />
    </Link>
  );
}