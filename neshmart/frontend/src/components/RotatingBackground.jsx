import { useEffect, useState } from 'react';

const IMAGES = [
  'https://i.postimg.cc/DfHkcTdd/Gemini-Generated-Image-fnfln6fnfln6fnfl.png',
  'https://i.postimg.cc/52pcb2nb/Gemini-Generated-Image-kv0qyukv0qyukv0q.png',
  'https://i.postimg.cc/HkYKZCHf/Gemini-Generated-Image-2ecpc72ecpc72ecp.jpg',
  'https://i.postimg.cc/tC5vVmPv/Gemini-Generated-Image-vt6irlvt6irlvt6i.png',
  'https://i.postimg.cc/7P1mpQBv/Gemini-Generated-Image-5b5bpj5b5bpj5b5b.jpg',
];

export default function RotatingBackground() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            filter: 'blur(6px) brightness(0.75)',
            transform: 'scale(1.08)',
            opacity: i === index ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-slate-900/30" />
    </div>
  );
}
