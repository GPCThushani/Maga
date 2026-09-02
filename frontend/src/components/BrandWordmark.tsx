interface BrandLogoProps {
  className?: string;
  src?: string;
}

export const BrandLogo = ({ className = 'h-7 w-auto', src = '/logo.png' }: BrandLogoProps) => {
  return (
    <div className="flex items-center gap-2">
      <img
        src={src}
        alt="මඟ (Maga)"
        className={`object-contain ${className}`}
        onError={(e) => {
          // Graceful fallback to clean typography if image file isn't present yet
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) (fallback as HTMLElement).style.display = 'flex';
        }}
      />
      <span
        style={{ display: 'none' }}
        className="text-lg font-semibold tracking-tight text-textPrimary"
      >
        මඟ <span className="text-xs text-textSecondary ml-1 font-normal">Maga</span>
      </span>
    </div>
  );
};