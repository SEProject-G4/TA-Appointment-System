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
        <p className="text-sm text-text-secondary mt-1">
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
          <div className="w-full flex-shrink-0 px-6 py-6">
            <p className="text-text-primary w-full text-center mb-2">
              Edit basic info of the new recruitment series.
            </p>
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
                <span className="label-text">
                  Postgraduate TA hours limit/week
                </span>
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
          </div>

          {/* Step 2 */}
          <div className="w-full flex-shrink-0 px-6 py-6">
            {/* Undergraduate mailing list */}
            <p className="text-text-primary w-full text-center mb-2">
              Edit Usergroups of potential TAs for the Recruitment Round.
            </p>
            <p className="text-text-secondary mt-2 mb-2 label-text">
              Potential TAs - Undergraduates
            </p>
            <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[20vh] overflow-hidden mx-2">
              <div className="flex py-1 px-3 items-start shadow-md w-full gap-x-3">
                <p className="text-text-secondary ml-2 mt-3">User group: </p>
                <div className="flex p-1 flex-1 flex-col items-start">
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
                    <p className="text-text-secondary text-xs mt-1">
                      All available undergraduate groups are already added to
                      the mailing list.
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
              <span className="text-warning text-xs ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.undergradMailingList}
              </span>
            )}

            {/* Postgraduate mailing list */}
            <p className="text-text-secondary mt-6 mb-2 label-text">
              Potential TAs - Postgraduates
            </p>
            <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[20vh] overflow-hidden mx-2">
              <div className="flex py-1 px-3 items-start shadow-md w-full gap-x-3">
                <p className="text-text-secondary ml-2 mt-3">User group: </p>
                <div className="flex p-1 flex-1 flex-col items-start">
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
              <span className="text-warning text-xs ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
                {inputErrors.postgradMailingList}
              </span>
            )}
          </div>

          {/* Step 3 */}
          <div className="w-full flex-shrink-0 px-6 py-6">
            <p className="text-text-primary w-full text-center mb-2">
              Choose modules to be included in the Recruitment Round.
            </p>

            {modules.length === 0 ? (
              <p className="text-text-secondary mt-4">No modules to display.</p>
            ) : (
              <>
                <p className="text-text-primary mb-2">
                  Selected modules ({selectedModules.length})
                </p>

                <div className="flex flex-col gap-y-3 max-h-[25vh] items-start justify-start overflow-y-auto ring-1 ring-text-secondary/50 py-2 px-3 rounded-md">
                  {selectedModules.map((mod) => (
                    <div
                      key={mod._id}
                      className="outline outline-1 outline-text-secondary py-2 pl-4 pr-3 rounded-md drop-shadow bg-bg-card flex items-center text-text-primary space-x-5"
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
                <p className="text-text-primary mb-2">Removed Modules ({removedModules.length})</p>
                <div className="flex flex-col gap-y-3 max-h-[20vh] ring-1 ring-text-secondary/50 py-2 px-3 rounded-md items-start justify-start overflow-y-auto">
                  {removedModules.map((mod) => (
                    <div
                      key={mod._id}
                      className="outline outline-1 outline-text-secondary py-2 pl-4 pr-3 rounded-md drop-shadow bg-bg-card flex items-center text-text-primary space-x-5"
                    >
                      <div className="flex flex-col items-start">
                        <p className="text-text-primary">{mod.label}</p>
                      </div>
                      <LuCirclePlus
                        className="ml-5 text-text-secondary hover:text-success cursor-pointer rounded-full size-6 hover:bg-success/10 "
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
          <div className="w-full flex-shrink-0 px-6 py-6 flex flex-col items-center justify-center">
            {isProcessing && (<div className="flex flex-col items-center">
              
              <Loader className="mb-5"/>
              <p className="text-text-primary text-lg mb-2">Processing...</p>
              <p className="text-text-secondary">This will take a few moments.</p>
            </div>)}
            {!isProcessing && (<div className="flex flex-col items-center">
              <RiCheckboxCircleFill className="text-success size-16 mb-5" />
              <p className="text-text-primary text-lg mb-2">Recruitment Round Created Succesfully!</p>
              <p className="text-text-secondary">You can now close this dialog.</p>
            </div>)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 flex justify-between">
        {currentStep<3 && (<button
          onClick={handleClose}
          className="px-4 py-2 ring-1 ring-text-secondary/50 text-text-secondary hover:text-text-inverted hover:bg-text-secondary/50 rounded-md transition-colors"
          disabled={isProcessing}
        >
          Cancel
        </button>)}

        <div className={`flex gap-2 ${currentStep==3?"flex-1 justify-center":""}`}>
          {(currentStep > 0 && currentStep < 3) && (
            <button
              onClick={prevStep}
              className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition-colors"
            >
              Previous
            </button>
          )}

          {currentStep < 2 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-primary text-text-inverted rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentStep === 0 && !isFirstPageValid()}
            >
              Next
            </button>
          ) : currentStep === 2 ? (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary text-text-inverted rounded-md hover:bg-primary-dark transition-colors flex items-center" 
            >
                Create Recruitment Round
            </button>
          ):(
            <button className="px-4 py-2 bg-primary text-text-inverted rounded-md hover:bg-primary-dark transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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