import { useState } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, ComboboxButton, Transition } from '@headlessui/react';
import { FaCheck, FaChevronDown } from 'react-icons/fa';


export interface Option {
  id: number | string;
  label: number | string;
}

interface AutoSelectProps {
  options: Option[];
  placeholder?: string;
  className?: string;
  selectedOption: Option | null;
  onSelect: (value: Option | null) => void;
}

const AutoSelect: React.FC<AutoSelectProps> = ({ options, placeholder = 'Select or type', className, selectedOption, onSelect }) => {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.label.toString().toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className={`w-52 ${className}`}>
      <Combobox value={selectedOption} onChange={onSelect} onClose={() => setQuery('')}>
        <div className="relative mt-1">
            <ComboboxInput
              className="w-full py-1 px-2 rounded-md outline outline-1 outline-text-secondary focus:outline-primary-light focus:outline-offset-1 focus:outline-2"
              displayValue={(option: Option | null) => (option ? option.label.toString() : '')}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <ComboboxButton className="absolute group inset-y-0 right-0 flex items-center px-2.5">
              <FaChevronDown
                className="size-5 text-text-secondary group-data-hover:text-text-primary"
                aria-hidden="true"
              />
            </ComboboxButton>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <ComboboxOptions anchor="bottom" className="absolute mt-1 max-h-60 w-(--input-width) overflow-auto rounded-md bg-bg-card py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-text-secondary">
                  Nothing found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option.id.toString()}
                    className={
                      `relative cursor-pointer select-none py-2 w-full px-5
                        bg-bg-card/80 text-text-primary 
                        data-[active]:bg-primary-dark/70 data-[active]:text-text-inverted
                        data-[selected]:bg-primary-dark/20 data-[selected]:text-text-primary
                      `
                    }
                    value={option}
                  >
                    <span className="block truncate">{option.label}</span>
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
};

export default AutoSelect;