import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

const BoundingBox = ({ children, className = "" }: Props) => {
  return (
    <div className={`w-full sm:max-w-[100vw] md:max-w-[110vw] lg:max-w-[120vw] xl:max-w-[130vw] h-full mx-auto border-2 md:border-4 border-prime p-6 md:p-12 relative border-dashed border-spacing-4 md:border-spacing-8 md:overflow-y-hidden flex bg-black custom-scrollbar ${className}`}>
      <div className="w-full h-full absolute top-0 left-0 border-2 border-prime blur-lg"></div>
      <div className="flex-grow">{children}</div>
    </div>
  );
};

export default BoundingBox;
