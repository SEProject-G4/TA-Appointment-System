import React, { useState } from "react";
import "./NewModule.css";
import { FaPlus, FaMinus } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import AutoSelect, { type Option } from "../components/AutoSelect";

interface FormData {
  moduleCode: string;
  moduleName: string;
  semester: Option | null;
  coordinators: Option[];
  tasRequired: number;
  taHours: number;
  taMinutes: number;
  appDueDate: string;
  docDueDate: string;
  specialNotes: string;
}

const lecturers: Option[] = [
  { id: 1, label: "Dr. Alice Smith" },
  { id: 2, label: "Prof. Bob Johnson" },
  { id: 3, label: "Dr. Charlie Brown" },
];

const NewModule: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    moduleCode: "",
    moduleName: "",
    semester: null,
    coordinators: [],
    tasRequired: 0,
    taHours: 0,
    taMinutes: 0,
    appDueDate: "",
    docDueDate: "",
    specialNotes: "",
  });

  const [availableLecturers, setAvailableLecturers] =
    useState<Option[]>(lecturers);
  const [page, setPage] = useState(1);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "tasRequired" ||
        name === "taHours" ||
        name === "taMinutes" ||
        name === "semester"
          ? Number(value)
          : value,
    }));
  };

  const handleCoordinatorChange = (value: Option | null) => {
    setFormData((prevData) => ({
      ...prevData,
      coordinators: value ? [...prevData.coordinators, value] : [],
    }));
    setAvailableLecturers((prev) =>
      prev.filter((lecturer) => lecturer.id !== value?.id)
    );
    console.log(formData);
  };

  const handleSemesterChange = (option: Option | null) => {
    setFormData((prevData) => ({
      ...prevData,
      semester: option,
    }));
  };

  const removeCoordinator = (lecturer: Option) => {
    const newCoordinators = formData.coordinators?.filter(
      (coord) => coord.id !== lecturer.id
    );
    setFormData((prevData) => ({
      ...prevData,
      coordinators: newCoordinators || [],
    }));
    setAvailableLecturers((prev) => [...prev, lecturer]);
  };

  const isFormValid = () => {
    const {
      moduleCode,
      moduleName,
      semester,
      coordinators,
      tasRequired,
      taHours,
      taMinutes,
      appDueDate,
      docDueDate,
    } = formData;
    return (
      moduleCode.length > 0 &&
      moduleName.length > 0 &&
      semester !== null &&
      coordinators &&
      coordinators.length > 0 &&
      tasRequired > 0 &&
      (taHours > 0 || taMinutes > 0) &&
      appDueDate.length > 0 &&
      docDueDate.length > 0
    );
  };

  const handleNext = () => {
    if (isFormValid()) {
      setPage(2);
    }
  };

  const handleCancel = () => {
    // Logic to cancel the form, e.g., redirect to another page
    console.log("Form canceled");
  };

  const semesters: Option[] = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    label: `Semester ${i + 1}`,
  }));

  if (page !== 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-3xl font-bold text-center mb-8">
          Page 2: Coming Soon!
        </h2>
        <button className="btn btn-primary" onClick={() => setPage(1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start p-4 min-h-screen bg-bg-page">
      <div className="rounded-lg w-full max-w-4xl bg-bg-card shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-base-content select-none">
          New Module for the Recruitment Series
        </h2>

        <div className="flex flex-col space-y-6">
          {/* Module Code */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Module Code</span>
            </label>
            <input
              type="text"
              name="moduleCode"
              placeholder="e.g. CS1011"
              value={formData.moduleCode}
              onChange={handleChange}
              maxLength={10}
              className="ml-8 new-module-input"
            />
          </div>

          {/* Module Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Module Name</span>
            </label>
            <input
              type="text"
              name="moduleName"
              placeholder="e.g. Program Construction"
              value={formData.moduleName}
              onChange={handleChange}
              className="ml-8 max-w-full w-96 new-module-input"
            />
          </div>

          {/* Semester */}
          <div className="form-control flex flex-row">
            <label className="label">
              <span className="label-text">Semester</span>
            </label>
            <AutoSelect
              options={semesters}
              selectedOption={formData.semester}
              onSelect={handleSemesterChange}
              placeholder="Select Semester"
              className="ml-8"
            />
          </div>

          {/* Module Coordinator(s) */}
          <div className="form-control flex flex-col">
            <div className="flex flex-row items-center space-x-8 mb-5 mt-8">
              <label className="label">
                <span className="label-text">Module Coordinator(s)</span>
              </label>
              <AutoSelect
                options={availableLecturers}
                selectedOption={null}
                onSelect={handleCoordinatorChange}
                placeholder="Select Coordinator(s)"
                className="ml-8"
              />
            </div>
            <div className="flex flex-row flex-wrap ml-8 space-x-5 items-start mb-8">
              {formData.coordinators &&
                formData.coordinators.length > 0 &&
                formData.coordinators.map((coordinator) => (
                  <div
                    key={coordinator.id}
                    className="outline outline-1 outline-text-secondary py-2 pl-4 pr-3 rounded-full drop-shadow bg-bg-card flex items-center text-text-primary space-x-3"
                  >
                    <p className="text-text-primary text-sm font-semibold">
                      {coordinator.label}
                    </p>
                    <MdClose
                      className="text-text-secondary hover:text-text-primary outline hover:outline-text-primary outline-1 outline-text-secondary cursor-pointer rounded-full p-0.5 size-5 hover:bg-primary-light/20 "
                      onClick={() => removeCoordinator(coordinator)}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* No. of TAs Required */}
          <div className="form-control flex flex-col space-y-5">
            <label className="label">
              <span className="label-text">No. of TAs Required</span>
            </label>
            <div className="ml-8 flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    tasRequired: Math.max(0, prev.tasRequired - 1),
                  }))
                }
                className="hover:text-primary-light hover:outline-primary-light hover:outline-2 rounded-sm p-2 text-sm outline-1 outline-text-secondary outline text-text-secondary"
              >
                <FaMinus />
              </button>
              <input
                type="number"
                min={0}
                max={20}
                name="tasRequired"
                value={formData.tasRequired}
                onChange={handleChange}
                className="new-module-input text-center new-module-type-select"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    tasRequired: prev.tasRequired + 1,
                  }))
                }
                className="hover:text-primary-light hover:outline-primary-light hover:outline-2 rounded-sm p-2 text-sm outline-1 outline-text-secondary outline text-text-secondary"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          {/* Requested TA hours /week /TA */}
          <div className="form-control flex flex-col space-y-4">
            <label className="label mt-5">
              <span className="label-text">Requested TA hours /week /TA</span>
            </label>
            <div className="flex ml-8 space-x-8">
              <label className="text-text-secondary flex flex-row items-center new-module-input">
                <input
                  type="number"
                  min={0}
                  max={50}
                  name="taHours"
                  value={formData.taHours}
                  onChange={handleChange}
                  className="pl-2 text-text-primary focus:outline-0 pr-2 border mr-2 border-0 border-r-2 border-r-text-secondary w-full"
                  placeholder="Hours"
                />
                hours
              </label>

              <label className="text-text-secondary flex flex-row items-center new-module-input">
                <input
                  type="number"
                  min={0}
                  max={59}
                  name="taMinutes"
                  value={formData.taMinutes}
                  onChange={handleChange}
                  className="pl-2 text-text-primary focus:outline-0 pr-2 border mr-2 border-0 border-r-2 border-r-text-secondary w-full"
                  placeholder="Minutes"
                />
                mins
              </label>
            </div>
          </div>

          {/* Application due date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Application Due Date</span>
            </label>
            <input
              type="datetime-local"
              name="appDueDate"
              value={formData.appDueDate}
              onChange={handleChange}
              className="input input-bordered"
            />
          </div>

          {/* Document submission deadline */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Document Submission Deadline</span>
            </label>
            <input
              type="datetime-local"
              name="docDueDate"
              value={formData.docDueDate}
              onChange={handleChange}
              className="input input-bordered"
            />
          </div>

          {/* Special Notes */}
          <div className="form-control flex flex-col">
            <label className="label">
              <span className="label-text">Special Notes</span>
            </label>
            <textarea
              name="specialNotes"
              value={formData.specialNotes}
              onChange={handleChange}
              className="new-module-input h-24 ml-8 mt-4"
              placeholder="Any special instructions or notes for applicants..."
            ></textarea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={handleCancel} className="text-primary rounded-md outline outline-2 outline-primary-light hover:bg-primary-light py-2 px-4 hover:text-text-inverted">
            Cancel
          </button>
          <button
            onClick={handleNext}
            className="text-primary rounded-md outline outline-2 outline-primary-light hover:bg-primary-light py-2 px-4 hover:text-text-inverted"
            disabled={!isFormValid()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewModule;
