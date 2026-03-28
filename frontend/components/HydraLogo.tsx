/* eslint-disable @next/next/no-img-element */
export function HydraLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/hydra.png"
      alt="HYDRA"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
