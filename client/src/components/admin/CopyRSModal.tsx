import {useState, useEffect } from "react";


import { RiCheckboxCircleFill } from "react-icons/ri";
import { MdClose } from "react-icons/md";
import { LuCirclePlus } from "react-icons/lu";

import AutoSelect from "../common/AutoSelect";
import Loader from "../common/Loader";
import Timeline from "../common/Timeline";

import { useModal } from "../../contexts/ModalProvider";

import axiosInstance from "../../api/axiosConfig";

import { toLocalDatetimeInputValue } from "../../utils/DateTime";

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

interface RecruitmentSeriesFormData {
  name: string;
  applicationDueDate: string;
  documentDueDate: string;
  undergradHourLimit: number;
  postgradHourLimit: number;
  undergradMailingList: UserGroup[];
  postgradMailingList: UserGroup[];
}

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

interface Option {
  id: number | string;
  label: number | string;
  subtitle?: string;
  picture?: string;
}

interface Module {
  _id: string;
  label: string;
}

interface CopyRSModalProps {
  recruitmentSeriesData: {
    _id: string;
    name: string;
    applicationDueDate: string;
    documentDueDate: string;
    undergradHourLimit: number;
    postgradHourLimit: number;
  };
  modules: Module[];
}


const CopyRSModal: React.FC<CopyRSModalProps> = ({
  recruitmentSeriesData,
  modules,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<RecruitmentSeriesFormData>({
    name: recruitmentSeriesData.name + " - Copy",
    applicationDueDate: toLocalDatetimeInputValue(
      new Date(recruitmentSeriesData.applicationDueDate)
    ),
    documentDueDate: toLocalDatetimeInputValue(
      new Date(recruitmentSeriesData.documentDueDate)
    ),
    undergradHourLimit: recruitmentSeriesData.undergradHourLimit,
    postgradHourLimit: recruitmentSeriesData.postgradHourLimit,
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
  const [selectedModules, setSelectedModules] = useState<Module[]>(modules);
  const [removedModules, setRemovedModules] = useState<Module[]>([]);
  const [usersCount, setUsersCount] = useState<{ under: number; post: number }>(
    {
      under: 0,
      post: 0,
    }
  );

  const { closeModal } = useModal();

  const handleUndergradGroupSelect = (group: Option | null) => {
    const selectedGroup = availableUndergradGroups.find(g => g._id === (group ? group.id : ''));
    setFormData((prevData) => ({
      ...prevData,
      undergradMailingList: selectedGroup
        ? [...prevData.undergradMailingList, selectedGroup]
        : [...prevData.undergradMailingList],
    }));
    if (selectedGroup) {
      setUsersCount((prev) => ({
        ...prev,
        under: prev.under + selectedGroup.userCount,
      }));
      setAvailableUndergradGroups((prev) =>
        prev.length > 0 ? prev.filter((g) => g._id !== selectedGroup._id) : []
      );
    }
  };

  const handlePostgradGroupSelect = (group: Option | null) => {
    const selectedGroup = availablePostgradGroups.find(g => g._id === (group ? group.id : ''));
    setFormData((prevData) => ({
      ...prevData,
      postgradMailingList: selectedGroup
        ? [...prevData.postgradMailingList, selectedGroup]
        : [...prevData.postgradMailingList],
    }));
    if (selectedGroup) {
      setUsersCount((prev) => ({ ...prev, post: prev.post + selectedGroup.userCount }));
      setAvailablePostgradGroups((prev) =>
        prev.length > 0 ? prev.filter((g) => g._id !== selectedGroup._id) : []
      );
    }
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
        const userCount = response.data.reduce(
          (acc: number, group: UserGroup) => acc + group.userCount,
          0
        );
        setUsersCount((prev) => ({
          ...prev,
          under: userCount,
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
        const userCount = response.data.reduce(
          (acc: number, group: UserGroup) => acc + group.userCount,
          0
        );
        setUsersCount((prev) => ({
          ...prev,
          post: userCount,
        }));
      } else {
        console.error("Failed to fetch postgraduate groups");
      }
    } catch (error) {
      console.error("Error fetching postgraduate groups:", error);
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

  const isFirstPageValid = () => {
    return (
      formData.name &&
      !inputErrors.name &&
      formData.applicationDueDate &&
      !inputErrors.applicationDueDate &&
      formData.documentDueDate &&
      !inputErrors.documentDueDate &&
      formData.undergradHourLimit > 0 &&
      !inputErrors.undergradHourLimit &&
      formData.postgradHourLimit > 0 &&
      !inputErrors.postgradHourLimit
    );
  };

  // const isFormValid = () => {
  //   return (
  //     !formData.name ||
  //     !!inputErrors.name ||
  //     !formData.undergradHourLimit ||
  //     !!inputErrors.undergradHourLimit ||
  //     !formData.postgradHourLimit ||
  //     !!inputErrors.postgradHourLimit ||
  //     !formData.applicationDueDate ||
  //     !!inputErrors.applicationDueDate ||
  //     !formData.documentDueDate ||
  //     !!inputErrors.documentDueDate ||
  //     (formData.undergradMailingList.length === 0 &&
  //       formData.postgradMailingList.length === 0)
  //   );
  // };

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

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    setCurrentStep(3);
    setIsProcessing(true);
      // Add your submission logic here
      console.log("Submitting copy request...");
      setTimeout(() => {
        setIsProcessing(false);
      }, 3000);
  };

  const handleClose = () => {
    setCurrentStep(0);
    closeModal();
  };

  useEffect(() => {
    fetchUndergradGroups();
    fetchPostgradGroups();
  }, []);

  return (
    <div className="bg-bg-card max-w-2xl max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-text-secondary/20">
        <h2 className="text-xl font-semibold text-text-primary">
          Copy Recruitment Series
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Making a copy using: {recruitmentSeriesData.name}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 py-2">
        <Timeline
          events={[
            { id: 0, title: "Basic Info" },
            { id: 1, title: "User groups" },
            { id: 2, title: "Modules" },
          ]}
          completedUpto={currentStep - 0.5}
        />
      </div>

      {/* Content Container */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentStep * 100}%)` }}
        >
          {/* Step 1 */}
          <div className="flex-shrink-0 w-full px-6 py-6">
            <p className="w-full mb-2 text-center text-text-primary">
              Edit basic info of the new recruitment series.
            </p>
            <div className="flex flex-col gap-y-6">
              {/* Series Name */}
              <div className="mt-5 form-control">
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
                  <span className="px-3 py-1 ml-8 text-sm rounded-sm text-warning bg-warning/10 w-fit">
                    {inputErrors.name}
                  </span>
                )}
              </div>
            </div>

            {/* Application Due Date */}
            <div className="flex flex-col gap-y-4">
              <div className="mt-5 form-control">
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
                <span className="px-3 py-1 ml-8 text-sm rounded-sm text-warning bg-warning/10 w-fit">
                  {inputErrors.applicationDueDate}
                </span>
              )}
            </div>

            {/* Document Submission Deadline */}
            <div className="flex flex-col gap-y-4">
              <div className="mt-5 form-control">
                <label className="label">
                  <span className="label-text">
                    Document Submission Deadline
                  </span>
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
                <span className="px-3 py-1 ml-8 text-sm rounded-sm text-warning bg-warning/10 w-fit">
                  {inputErrors.documentDueDate}
                </span>
              )}
            </div>

            {/* Undergraduate TA hours limit/week */}
            <div className="flex flex-col space-y-4 form-control">
              <label className="mt-5 label">
                <span className="label-text">
                  Undergraduate TA hours limit/week
                </span>
              </label>
              <div className="flex ml-8 space-x-8">
                <label className="flex flex-row items-center text-text-secondary new-module-input">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    name="undergradHourLimit"
                    value={formData.undergradHourLimit}
                    onChange={handleChange}
                    className="w-full pl-2 pr-2 mr-2 border border-0 border-r-2 text-text-primary focus:outline-0 border-r-text-secondary"
                    placeholder="Hours"
                  />
                  hours
                </label>
                {inputErrors.undergradHourLimit && (
                  <span className="flex items-center px-3 py-1 ml-8 text-sm rounded-sm text-warning bg-warning/10 w-fit">
                    {inputErrors.undergradHourLimit}
                  </span>
                )}
              </div>
            </div>

            {/* Postgraduate TA hours limit/week */}
            <div className="flex flex-col space-y-4 form-control">
              <label className="mt-5 label">
                <span className="label-text">
                  Postgraduate TA hours limit/week
                </span>
              </label>
              <div className="flex ml-8 space-x-8">
                <label className="flex flex-row items-center text-text-secondary new-module-input">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    name="postgradHourLimit"
                    value={formData.postgradHourLimit}
                    onChange={handleChange}
                    className="w-full pl-2 pr-2 mr-2 border border-0 border-r-2 text-text-primary focus:outline-0 border-r-text-secondary"
                    placeholder="Hours"
                  />
                  hours
                </label>
                {inputErrors.postgradHourLimit && (
                  <span className="flex items-center px-3 py-1 ml-8 text-sm rounded-sm text-warning bg-warning/10 w-fit">
                    {inputErrors.postgradHourLimit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex-shrink-0 w-full px-6 py-6">
            {/* Undergraduate mailing list */}
            <p className="w-full mb-2 text-center text-text-primary">
              Edit Usergroups of potential TAs for the Recruitment Round.
            </p>
            <p className="mt-2 mb-2 text-text-secondary label-text">
              Potential TAs - Undergraduates
            </p>
            <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[20vh] overflow-hidden mx-2">
              <div className="flex items-start w-full px-3 py-1 shadow-md gap-x-3">
                <p className="mt-3 ml-2 text-text-secondary">User group: </p>
                <div className="flex flex-col items-start flex-1 p-1">
                  <AutoSelect
                    options={availableUndergradGroups.map((group) => ({
                      id: group._id,
                      label: group.name,
                      subtitle: `${group.userCount} users`,
                    }))}
                    selectedOption={null}
                    onSelect={handleUndergradGroupSelect}
                  />
                  {availableUndergradGroups.length === 0 && (
                    <p className="mt-1 text-xs text-text-secondary">
                      All available undergraduate groups are already added to
                      the mailing list.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-start justify-start flex-1 p-2 pt-4 overflow-x-hidden overflow-y-auto gap-x-3 gap-y-2">
                {formData.undergradMailingList.map((group, index) => (
                  <div
                    key={index}
                    className="flex items-center py-2 pl-4 pr-3 space-x-5 rounded-md outline outline-1 outline-text-secondary drop-shadow bg-bg-card text-text-primary"
                  >
                    <div className="flex flex-col items-start">
                      <p className="text-text-primary">{group.name}</p>
                      <p className="text-xs font-semibold text-text-secondary">
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
                        setAvailableUndergradGroups((prev) =>
                          prev.concat(group)
                        );
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
                <span className="font-semibold">{` ${usersCount.under}`}</span>
              </p>
            </div>
            {inputErrors.undergradMailingList && (
              <span className="px-3 py-1 ml-8 text-xs rounded-sm text-warning bg-warning/10 w-fit">
                {inputErrors.undergradMailingList}
              </span>
            )}

            {/* Postgraduate mailing list */}
            <p className="mt-6 mb-2 text-text-secondary label-text">
              Potential TAs - Postgraduates
            </p>
            <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[20vh] overflow-hidden mx-2">
              <div className="flex items-start w-full px-3 py-1 shadow-md gap-x-3">
                <p className="mt-3 ml-2 text-text-secondary">User group: </p>
                <div className="flex flex-col items-start flex-1 p-1">
                  <AutoSelect
                    options={availablePostgradGroups.map((group) => ({
                      id: group._id,
                      label: group.name,
                      subtitle: `${group.userCount} users`,
                    }))}
                    selectedOption={null}
                    onSelect={handlePostgradGroupSelect}
                  />
                  {availablePostgradGroups.length === 0 && (
                    <p className="mt-1 text-xs text-text-secondary">
                      All available postgraduate groups are already added to the
                      mailing list.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-start justify-start flex-1 p-2 pt-4 overflow-x-hidden overflow-y-auto gap-x-3 gap-y-2">
                {formData.postgradMailingList.map((group, index) => (
                  <div
                    key={index}
                    className="flex items-center py-2 pl-4 pr-3 space-x-5 rounded-md outline outline-1 outline-text-secondary drop-shadow bg-bg-card text-text-primary"
                  >
                    <div className="flex flex-col items-start">
                      <p className="text-text-primary">{group.name}</p>
                      <p className="text-xs font-semibold text-text-secondary">
                        {group.userCount} Users
                      </p>
                    </div>
                    <MdClose
                      className="ml-5 text-text-secondary hover:text-text-primary outline hover:outline-text-primary outline-1 outline-text-secondary cursor-pointer rounded-full p-0.5 size-5 hover:bg-primary-light/20 "
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          postgradMailingList:
                            formData.postgradMailingList.filter(
                              (item) => item._id !== group._id
                            ),
                        }));
                        setAvailablePostgradGroups((prev) =>
                          prev.concat(group)
                        );
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
                <span className="font-semibold">{` ${usersCount.post}`}</span>
              </p>
            </div>
            {inputErrors.postgradMailingList && (
              <span className="px-3 py-1 ml-8 text-xs rounded-sm text-warning bg-warning/10 w-fit">
                {inputErrors.postgradMailingList}
              </span>
            )}
          </div>

          {/* Step 3 */}
          <div className="flex-shrink-0 w-full px-6 py-6">
            <p className="w-full mb-2 text-center text-text-primary">
              Choose modules to be included in the Recruitment Round.
            </p>

            {modules.length === 0 ? (
              <p className="mt-4 text-text-secondary">No modules to display.</p>
            ) : (
              <>
                <p className="mb-2 text-text-primary">
                  Selected modules ({selectedModules.length})
                </p>

                <div className="flex flex-col gap-y-3 max-h-[25vh] items-start justify-start overflow-y-auto ring-1 ring-text-secondary/50 py-2 px-3 rounded-md">
                  {selectedModules.map((mod) => (
                    <div
                      key={mod._id}
                      className="flex items-center py-2 pl-4 pr-3 space-x-5 rounded-md outline outline-1 outline-text-secondary drop-shadow bg-bg-card text-text-primary"
                    >
                      <div className="flex flex-col items-start">
                        <p className="text-text-primary">{mod.label}</p>
                      </div>
                      <MdClose
                        className="ml-5 text-text-secondary hover:text-warning outline hover:outline-warning outline-1 outline-text-secondary cursor-pointer rounded-full p-0.5 size-5 hover:bg-warning/10 "
                        onClick={() => {
                          setSelectedModules((prev) =>
                            prev.filter((m) => m._id !== mod._id)
                          );
                          setRemovedModules((prev) => prev.concat(mod));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
            {modules.length > 0 && removedModules.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-text-primary">Removed Modules ({removedModules.length})</p>
                <div className="flex flex-col gap-y-3 max-h-[20vh] ring-1 ring-text-secondary/50 py-2 px-3 rounded-md items-start justify-start overflow-y-auto">
                  {removedModules.map((mod) => (
                    <div
                      key={mod._id}
                      className="flex items-center py-2 pl-4 pr-3 space-x-5 rounded-md outline outline-1 outline-text-secondary drop-shadow bg-bg-card text-text-primary"
                    >
                      <div className="flex flex-col items-start">
                        <p className="text-text-primary">{mod.label}</p>
                      </div>
                      <LuCirclePlus
                        className="ml-5 rounded-full cursor-pointer text-text-secondary hover:text-success size-6 hover:bg-success/10 "
                        onClick={() => {
                          setRemovedModules((prev) =>
                            prev.filter((m) => m._id !== mod._id)
                          );
                          setSelectedModules((prev) => prev.concat(mod));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Last step */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 w-full px-6 py-6">
            {isProcessing && (<div className="flex flex-col items-center">
              
              <Loader className="mb-5"/>
              <p className="mb-2 text-lg text-text-primary">Processing...</p>
              <p className="text-text-secondary">This will take a few moments.</p>
            </div>)}
            {!isProcessing && (<div className="flex flex-col items-center">
              <RiCheckboxCircleFill className="mb-5 text-success size-16" />
              <p className="mb-2 text-lg text-text-primary">Recruitment Round Created Succesfully!</p>
              <p className="text-text-secondary">You can now close this dialog.</p>
            </div>)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between px-6 py-4">
        {currentStep<3 && (<button
          onClick={handleClose}
          className="px-4 py-2 transition-colors rounded-md ring-1 ring-text-secondary/50 text-text-secondary hover:text-text-inverted hover:bg-text-secondary/50"
          disabled={isProcessing}
        >
          Cancel
        </button>)}

        <div className={`flex gap-2 ${currentStep==3?"flex-1 justify-center":""}`}>
          {(currentStep > 0 && currentStep < 3) && (
            <button
              onClick={prevStep}
              className="px-4 py-2 transition-colors border rounded-md border-primary text-primary hover:bg-primary/10"
            >
              Previous
            </button>
          )}

          {currentStep < 2 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 transition-colors rounded-md bg-primary text-text-inverted hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentStep === 0 && !isFirstPageValid()}
            >
              Next
            </button>
          ) : currentStep === 2 ? (
            <button
              onClick={handleCreate}
              className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-text-inverted hover:bg-primary-dark" 
            >
                Create Recruitment Round
            </button>
          ):(
            <button className="flex items-center px-4 py-2 transition-colors rounded-md bg-primary text-text-inverted hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
            onClick={handleClose}
            >
              OK
            </button>

          )}
        </div>
      </div>
    </div>
  );
};

export default CopyRSModal;