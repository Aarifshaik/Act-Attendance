export default function Footer() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-lg">
        <span className="text-xs text-gray-500">
          Developed by{" "}
          <a
            // href="https://github.com/Aarifshaik"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:underline"
          >
            Aarif Shaik
          </a>
        </span>
      </div>
    </div>
  );
}
