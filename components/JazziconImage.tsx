import Jazzicon from '@raugfer/jazzicon';

// builds an image data url for embedding
function buildDataUrl(address: string): string {
  return 'data:image/svg+xml;base64,' + btoa(Jazzicon(address));
}

// sample code for react component
export default function JazziconImage({ address, className }: { address: string, className?: string }) {
  const imageUrl = buildDataUrl(address);
  return (
    <img src={imageUrl} alt="Jazzicon" className={className} />
  );
}