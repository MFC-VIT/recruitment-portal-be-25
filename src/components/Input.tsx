import { useState } from "react";

interface Props {
  label: string;
  placeholder: string;
  type: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;  
}

const Input: React.FC<Props> = ({
  label,
  placeholder,
  type,
  value,
  onChange,
  required = false,
  className = "", 
}: Props) => {
  const [inputType, setInputType] = useState(type);
  
  return (
    <div className={`relative w-full input-container ${className}`}>
      <input
        className="nes-input is-dark text-white outline-none"
        type={inputType}
        placeholder={placeholder}
        name={label}
        value={value}
        onChange={onChange}
        required={required}
      />
      {type === "password" && (
        <button
          className="absolute top-1/2 -translate-y-1/2 right-2 h-1/2 w-10 outline-none border-0"
          onClick={() => {
            setInputType(inputType === "text" ? "password" : "text");
          }}
          type="button"
        >
          {inputType === "password" ? (
            <img src="/eye.png" alt="Show password" className="h-full mx-auto invert" />
          ) : (
            <img src="/invisible.png" alt="Hide password" className="h-full mx-auto invert" />
          )}
        </button>
      )}
    </div>
  );
};

export default Input;