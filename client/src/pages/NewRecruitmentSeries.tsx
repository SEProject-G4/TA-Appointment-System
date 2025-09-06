import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxButton,
  Transition,
} from "@headlessui/react";

import { MdClose } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa";
import axiosInstance from "../api/axiosConfig";
import { useToast } from "../contexts/ToastContext";

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

interface UserSelectProps {
  options: UserGroup[];
  className?: string;
  selectedOption: UserGroup | null;
  onSelect: (selected: UserGroup | null) => void;
}

const GroupSelect: React.FC<UserSelectProps> = ({
  options,
  onSelect,
  className,
  selectedOption,
}) => {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.name.toString().toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className={`${className}`}>
      <Combobox
        disabled={options.length === 0}
        value={selectedOption}
        onChange={onSelect}
        onClose={() => setQuery("")}
      >
        <div className="relative mt-1">
          <ComboboxInput
            className="w-full py-1 px-2 rounded-md outline outline-1 outline-text-secondary focus:outline-primary-light focus:outline-offset-1 focus:outline-2"
            displayValue={(option: UserGroup | null) =>
              option ? option.name.toString() : ""
            }
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              "Select a User Group to add its users to the mailing list"
            }
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
            <ComboboxOptions
              anchor="bottom"
              className="absolute mt-1 max-h-60 w-(--input-width) overflow-auto rounded-md bg-bg-card py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50"
            >
              {filteredOptions.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-text-secondary">
                  Nothing found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option._id}
                    className={`relative cursor-pointer select-none py-2 w-full px-5
                            bg-bg-card/80 text-text-primary 
                            data-[active]:bg-primary-dark/70 data-[active]:text-text-inverted
                            data-[selected]:bg-primary-dark/20 data-[selected]:text-text-primary
                          `}
                    value={option}
                  >
                    <div className="flex flex-col">
                      <span className="block truncate">{option.name}</span>
                      <span className="block truncate text-sm font-semibold">
                        {option.userCount} users
                      </span>
                    </div>
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

interface RecruitmentSeriesFormData {
  name: string;
  applicationDueDate: string;
  documentDueDate: string;
  undergradHourLimit: number;
  postgradHourLimit: number;
  undergradMailingList: UserGroup[];
  postgradMailingList: UserGroup[];
}

function NewRecruitmentSeries() {
  const [formData, setFormData] = useState<RecruitmentSeriesFormData>({
    name: "",
    applicationDueDate: "",
    documentDueDate: "",
    undergradHourLimit: 6,
    postgradHourLimit: 18,
    undergradMailingList: [],
    postgradMailingList: [],
  });
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});

  const [availableUndergradGroups, setAvailableUndergradGroups] = useState<
    UserGroup[]
  >([]);
  const [availablePostgradGroups, setAvailablePostgradGroups] = useState<
    UserGroup[]
  >([]);
  const [usrsCount, setUsersCount] = useState<{ under: number; post: number }>({
    under: 0,
    post: 0,
  });

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleUndergradGroupSelect = (group: UserGroup | null) => {
    setFormData((prevData) => ({
      ...prevData,
      undergradMailingList: group
        ? [...prevData.undergradMailingList, group]
        : [...prevData.undergradMailingList],
    }));
    if (group) {
      setUsersCount((prev) => ({
        ...prev,
        under: prev.under + group.userCount,
      }));
      setAvailableUndergradGroups((prev) =>
        prev.length > 0 ? prev.filter((g) => g._id !== group._id) : []
      );
    }
  };

  const handlePostgradGroupSelect = (group: UserGroup | null) => {
    setFormData((prevData) => ({
      ...prevData,
      postgradMailingList: group
        ? [...prevData.postgradMailingList, group]
        : [...prevData.postgradMailingList],
    }));
    if (group) {
      setUsersCount((prev) => ({ ...prev, post: prev.post + group.userCount }));
      setAvailablePostgradGroups((prev) =>
        prev.length > 0 ? prev.filter((g) => g._id !== group._id) : []
      );
    }
  };

  const validateField = (fieldName: string, value: any) => {
    let error = "";
    switch (fieldName) {
      case "name":
        if (!value) error = "Name is required";
        break;
      case "applicationDueDate":
        if (!value) error = "Application due date is required.";
        else if (
          formData.documentDueDate &&
          value &&
          new Date(formData.documentDueDate) < new Date(value)
        ) {
          error =
            "Application due date must be on or before document submission deadline.";
        }
        break;
      case "documentDueDate":
        if (!value) error = "Document due date is required.";
        else if (
          formData.applicationDueDate &&
          value &&
          new Date(formData.applicationDueDate) > new Date(value)
        ) {
          error = "Document due date must be on or after application due date.";
        }
        break;
      case "undergradHourLimit":
      case "postgradHourLimit":
        if (value <= 0) error = "Hour limit must be positive";
        break;
      case "undergradMailingList":
      case "postgradMailingList":
        if (!Array.isArray(value)) error = "Invalid mailing list";
        break;
      default:
        break;
    }
    setInputErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const isFormValid = () => {
    return (
      !formData.name ||
      !!inputErrors.name ||
      !formData.undergradHourLimit ||
      !!inputErrors.undergradHourLimit ||
      !formData.postgradHourLimit ||
      !!inputErrors.postgradHourLimit ||
      !formData.applicationDueDate ||
      !!inputErrors.applicationDueDate ||
      !formData.documentDueDate ||
      !!inputErrors.documentDueDate ||
      (formData.undergradMailingList.length === 0 &&
        formData.postgradMailingList.length === 0)
    );
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      newValue = e.target.checked;
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "undergradHourLimit" || name === "postgradHourLimit"
          ? Number(newValue)
          : newValue,
    }));
    // Validate on change
    validateField(name, newValue);
  };

  const fetchUndergradGroups = async () => {
    try {
      const response = await axiosInstance.get(
        "/user-management/groups/undergraduate"
      );
      if (response.status === 200) {
        setFormData((prevData) => ({
          ...prevData,
          undergradMailingList: response.data,
        }));
        // console.log(response.data);
      } else {
        console.error("Failed to fetch undergraduate groups");
      }
    } catch (error) {
      console.error("Error fetching undergraduate groups:", error);
    }
  };

  const fetchPostgradGroups = async () => {
    try {
      const response = await axiosInstance.get(
        "/user-management/groups/postgraduate"
      );
      if (response.status === 200) {
        setFormData((prevData) => ({
          ...prevData,
          postgradMailingList: response.data,
        }));
        // console.log(response.data);
      } else {
        console.error("Failed to fetch postgraduate groups");
      }
    } catch (error) {
      console.error("Error fetching postgraduate groups:", error);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      const RSData = {
        ...formData,
        applicationDueDate: new Date(formData.applicationDueDate).toISOString(),
        documentDueDate: new Date(formData.documentDueDate).toISOString(),
      };
      console.log("Sending form data", RSData);
      try {
        const response = await axiosInstance.post(
          "/recruitment-series/create",
          RSData
        );
        if (response.status === 201) {
          // Handle successful creation
          showToast("Recruitment series created successfully", "success");
          navigate("/admin-dashboard");
        } else {
          showToast("Failed to create recruitment series", "error");
          console.error("Failed to create recruitment series");
        }
      } catch (error) {
        showToast("Error creating recruitment series", "error");
        console.error("Error creating recruitment series:", error);
      }
    }else{
      showToast("Please fix errors in the form, before submitting", "error");
      Object.keys(formData).forEach((key) => validateField(key, (formData as any)[key]));
    }
  };

  useEffect(() => {
    fetchUndergradGroups();
    fetchPostgradGroups();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start p-4 min-h-screen bg-gradient-to-br from-primary-dark/10 to-primary-light/20">
      <div className="rounded-lg w-full max-w-4xl bg-bg-card shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-base-content select-none">
          New Recruitment Series
        </h2>

        <div className="flex flex-col gap-y-6">
          {/* Series Name */}
          <div className="form-control mt-5">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. 2026 - 2, 4, 8 Semesters"
              value={formData.name}
              onChange={handleChange}
              className="ml-8 new-module-input"
              style={{ width: "300px" }}
            />
            {inputErrors.name && (
              <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.name}
              </span>
            )}
          </div>
        </div>

        {/* Application Due Date */}
        <div className="flex flex-col gap-y-4">
          <div className="form-control mt-5">
            <label className="label">
              <span className="label-text">Application Due Date</span>
            </label>
            <input
              type="datetime-local"
              name="applicationDueDate"
              value={formData.applicationDueDate}
              onChange={handleChange}
              className="ml-5 input input-bordered"
            />
          </div>
          {inputErrors.applicationDueDate && (
            <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
              {inputErrors.applicationDueDate}
            </span>
          )}
        </div>

        {/* Document Submission Deadline */}
        <div className="flex flex-col gap-y-4">
          <div className="form-control mt-5">
            <label className="label">
              <span className="label-text">Document Submission Deadline</span>
            </label>
            <input
              type="datetime-local"
              name="documentDueDate"
              value={formData.documentDueDate}
              onChange={handleChange}
              className="ml-5 input input-bordered"
            />
          </div>
          {inputErrors.documentDueDate && (
            <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
              {inputErrors.documentDueDate}
            </span>
          )}
        </div>

        {/* Undergraduate TA hours limit/week */}
        <div className="form-control flex flex-col space-y-4">
          <label className="label mt-5">
            <span className="label-text">
              Undergraduate TA hours limit/week
            </span>
          </label>
          <div className="flex ml-8 space-x-8">
            <label className="text-text-secondary flex flex-row items-center new-module-input">
              <input
                type="number"
                min={0}
                max={50}
                name="undergradHourLimit"
                value={formData.undergradHourLimit}
                onChange={handleChange}
                className="pl-2 text-text-primary focus:outline-0 pr-2 border mr-2 border-0 border-r-2 border-r-text-secondary w-full"
                placeholder="Hours"
              />
              hours
            </label>
            {inputErrors.undergradHourLimit && (
              <span className="text-warning items-center flex text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.undergradHourLimit}
              </span>
            )}
          </div>
        </div>

        {/* Postgraduate TA hours limit/week */}
        <div className="form-control flex flex-col space-y-4">
          <label className="label mt-5">
            <span className="label-text">Postgraduate TA hours limit/week</span>
          </label>
          <div className="flex ml-8 space-x-8">
            <label className="text-text-secondary flex flex-row items-center new-module-input">
              <input
                type="number"
                min={0}
                max={50}
                name="postgradHourLimit"
                value={formData.postgradHourLimit}
                onChange={handleChange}
                className="pl-2 text-text-primary focus:outline-0 pr-2 border mr-2 border-0 border-r-2 border-r-text-secondary w-full"
                placeholder="Hours"
              />
              hours
            </label>
            {inputErrors.postgradHourLimit && (
              <span className="text-warning items-center flex text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.postgradHourLimit}
              </span>
            )}
          </div>
        </div>

        {/* Undergraduate mailing list */}
        <p className="text-text-secondary mt-6 mb-2 label-text">
          Potential TAs - Undergraduates
        </p>
        <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[30vh] overflow-hidden mx-2">
          <div className="flex py-1 px-3 items-start shadow-md w-full gap-x-3">
            <p className="text-text-secondary ml-2 mt-3">User group: </p>
            <div className="flex p-1 flex-1 flex-col items-start">
              <GroupSelect
                options={availableUndergradGroups}
                selectedOption={null}
                onSelect={handleUndergradGroupSelect}
                className="w-full"
              />
              {availableUndergradGroups.length === 0 && (
                <p className="text-text-secondary text-xs mt-1">
                  All available undergraduate groups are already added to the
                  mailing list.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-1 p-2 pt-4 flex-wrap items-start justify-start gap-x-3 gap-y-2 overflow-x-hidden overflow-y-auto">
            {formData.undergradMailingList.map((group, index) => (
              <div
                key={index}
                className="outline outline-1 outline-text-secondary py-2 pl-4 pr-3 rounded-md drop-shadow bg-bg-card flex items-center text-text-primary space-x-5"
              >
                <div className="flex flex-col items-start">
                  <p className="text-text-primary">{group.name}</p>
                  <p className="text-text-secondary font-semibold text-xs">
                    {group.userCount} Users
                  </p>
                </div>
                <MdClose
                  className="ml-5 text-text-secondary hover:text-text-primary outline hover:outline-text-primary outline-1 outline-text-secondary cursor-pointer rounded-full p-0.5 size-5 hover:bg-primary-light/20 "
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      undergradMailingList:
                        formData.undergradMailingList.filter(
                          (item) => item._id !== group._id
                        ),
                    }));
                    setAvailableUndergradGroups((prev) => prev.concat(group));
                    setUsersCount((prev) => ({
                      ...prev,
                      under: prev.under - group.userCount,
                    }));
                  }}
                />
              </div>
            ))}
          </div>

          <p className="px-2 py-1 text-text-secondary text-sm border-t-[1px] border-solid border-text-secondary/80">
            Total User Count:
            <span className="font-semibold">{` ${usrsCount.under}`}</span>
          </p>
        </div>
        {inputErrors.undergradMailingList && (
          <span className="text-warning text-xs ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
            {inputErrors.undergradMailingList}
          </span>
        )}

        {/* Postgraduate mailing list */}
        <p className="text-text-secondary mt-6 mb-2 label-text">
          Potential TAs - Postgraduates
        </p>
        <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[30vh] overflow-hidden mx-2">
          <div className="flex py-1 px-3 items-start shadow-md w-full gap-x-3">
            <p className="text-text-secondary ml-2 mt-3">User group: </p>
            <div className="flex p-1 flex-1 flex-col items-start">
              <GroupSelect
                options={availablePostgradGroups}
                selectedOption={null}
                onSelect={handlePostgradGroupSelect}
                className="w-full"
              />
              {availablePostgradGroups.length === 0 && (
                <p className="text-text-secondary text-xs mt-1">
                  All available postgraduate groups are already added to the
                  mailing list.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-1 p-2 pt-4 flex-wrap items-start justify-start gap-x-3 gap-y-2 overflow-x-hidden overflow-y-auto">
            {formData.postgradMailingList.map((group, index) => (
              <div
                key={index}
                className="outline outline-1 outline-text-secondary py-2 pl-4 pr-3 rounded-md drop-shadow bg-bg-card flex items-center text-text-primary space-x-5"
              >
                <div className="flex flex-col items-start">
                  <p className="text-text-primary">{group.name}</p>
                  <p className="text-text-secondary font-semibold text-xs">
                    {group.userCount} Users
                  </p>
                </div>
                <MdClose
                  className="ml-5 text-text-secondary hover:text-text-primary outline hover:outline-text-primary outline-1 outline-text-secondary cursor-pointer rounded-full p-0.5 size-5 hover:bg-primary-light/20 "
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      postgradMailingList: formData.postgradMailingList.filter(
                        (item) => item._id !== group._id
                      ),
                    }));
                    setAvailablePostgradGroups((prev) => prev.concat(group));
                    setUsersCount((prev) => ({
                      ...prev,
                      post: prev.post - group.userCount,
                    }));
                  }}
                />
              </div>
            ))}
          </div>

          <p className="px-2 py-1 text-text-secondary text-sm border-t-[1px] border-solid border-text-secondary/80">
            Total User Count:
            <span className="font-semibold">{` ${usrsCount.under}`}</span>
          </p>
        </div>
        {inputErrors.postgradMailingList && (
          <span className="text-warning text-xs ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
            {inputErrors.postgradMailingList}
          </span>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-text-primary rounded-md outline outline-2 outline-text-primary hover:bg-text-primary w-48 py-2 px-4 hover:text-text-inverted"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="rounded-md outline outline-2 outline-primary-light hover:bg-primary-light bg-primary py-2 px-4 text-text-inverted"
          >
            Create Recruitment Series
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewRecruitmentSeries;