import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#fafafa] text-center px-6">
      <h1 className="text-[8rem] md:text-[12rem] font-anton text-[#111] leading-none mb-4">404</h1>
      <div className="bg-[#c1ff00] text-black px-4 py-2 border-2 border-black font-anton uppercase text-xl mb-6 shadow-[4px_4px_0_0_#000] -rotate-2">
        Page Not Found
      </div>
      <p className="font-poppins font-medium text-gray-600 max-w-md mb-8">
        The coordinates you entered are out of bounds. The page you are looking for has been extracted or does not exist.
      </p>
      <Link href="/">
        <button className="bg-black text-white px-8 py-3.5 rounded-full font-poppins font-bold uppercase text-sm tracking-widest hover:bg-[#c1ff00] hover:text-black border-2 border-black transition-colors duration-300">
          Return to Surface
        </button>
      </Link>
    </div>
  );
}
