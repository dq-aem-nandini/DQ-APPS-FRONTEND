// import { Button } from "@/components/ui/button";
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//      <h1>Landing Page</h1>
//     </div>
//   );
// }
// app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/auth/login');
}