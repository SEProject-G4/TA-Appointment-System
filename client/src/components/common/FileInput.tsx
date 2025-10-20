import React from "react";
import { Paperclip, X } from "lucide-react";

interface FileInputProps {
  label: string;
  name: string;
  accept: string;
  required?: boolean;
  value: File | null;
  onChange: (name: string, file: File | null) => void;
  helperText?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  name,
  accept,
  required = false,
  value,
  onChange,
  helperText,
}) => {
  const inputId = `file-${name}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(name, file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange(name, null);
  };

  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-text-primary">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          id={inputId}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
        />
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 w-full px-3 py-2 border border-border-default rounded-lg bg-bg-card text-text-secondary hover:bg-primary-light/10 hover:border-primary/50 transition-all cursor-pointer group"
        >
          <Paperclip className="w-4 h-4 flex-shrink-0 text-primary group-hover:text-primary-dark transition-colors" />
          <span className="text-sm flex-1 truncate">
            {value ? value.name : "Choose file..."}
          </span>
          {value ? (
            <button
              type="button"
              onClick={handleRemove}
              className="flex-shrink-0 p-1 rounded-full hover:bg-error/10 transition-colors"
              title="Remove file"
            >
              <X className="w-3 h-3 text-error" />
            </button>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
              Browse
            </span>
          )}
        </label>
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-text-secondary">{helperText}</p>
      )}
    </div>
  );
};

export default FileInput;
