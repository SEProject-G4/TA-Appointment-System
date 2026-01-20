import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdClose } from "react-icons/md";
import axiosInstance from "../../api/axiosConfig";
import { useToast } from "../../contexts/ToastContext";
import Loader from "../../components/common/Loader";
import { useRoundsStore } from "../../stores/useRoundsStore";
import { areDatesEffectivelySame } from "../../utils/DateTime";
import GroupSelect from "../../components/admin/GroupSelect";

interface UserGroup {
  _id: string;
  name: string;
  userCount: number;
}

interface RecruitmentRoundFormData {
  name: string;
  applicationDueDate: string;
  documentDueDate: string;
  undergradHourLimit: number;
  postgradHourLimit: number;
  undergradMailingList: UserGroup[];
  postgradMailingList: UserGroup[];
  status: string;
}

function toLocalDatetimeInputValue(date: Date) {
  // Ensure we get the local time zone offset correctly
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function EditRecruitmentRound() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [formData, setFormData] = useState<RecruitmentRoundFormData>({
    name: "",
    applicationDueDate: "",
    documentDueDate: "",
    undergradHourLimit: 6,
    postgradHourLimit: 18,
    undergradMailingList: [],
    postgradMailingList: [],
    status: "",
  });
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  const [availableUndergradGroups, setAvailableUndergradGroups] = useState<
    UserGroup[]
  >([]);
  const [availablePostgradGroups, setAvailablePostgradGroups] = useState<
    UserGroup[]
  >([]);
  const [allUndergradGroups, setAllUndergradGroups] = useState<UserGroup[]>([]);
  const [allPostgradGroups, setAllPostgradGroups] = useState<UserGroup[]>([]);
  const [usersCount, setUsersCount] = useState<{ under: number; post: number }>(
    {
      under: 0,
      post: 0,
    },
  );
  const [originalDates, setOriginalDates] = useState<{
    appDueDate: string;
    docDueDate: string;
  }>({
    appDueDate: "",
    docDueDate: "",
  });

  const getRoundById = useRoundsStore((state) => state.getRoundById);
  const updateRound = useRoundsStore((state) => state.updateRound);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleUndergradGroupSelect = (group: UserGroup | null) => {
    if (!group) return;
    const newGroupsArr = [...formData.undergradMailingList, group];
    validateField("undergradMailingList", newGroupsArr);
    setFormData((prevData) => ({
      ...prevData,
      undergradMailingList: newGroupsArr,
    }));
    setUsersCount((prev) => ({
      ...prev,
      under: prev.under + group.userCount,
    }));
    setAvailableUndergradGroups((prev) =>
      prev.length > 0 ? prev.filter((g) => g._id !== group._id) : [],
    );
  };

  const handlePostgradGroupSelect = (group: UserGroup | null) => {
    if (!group) return;
    const newGroupsArr = [...formData.postgradMailingList, group];
    validateField("postgradMailingList", newGroupsArr);
    setFormData((prevData) => ({
      ...prevData,
      postgradMailingList: newGroupsArr,
    }));
    setUsersCount((prev) => ({ ...prev, post: prev.post + group.userCount }));
    setAvailablePostgradGroups((prev) =>
      prev.length > 0 ? prev.filter((g) => g._id !== group._id) : [],
    );
  };

  const validateField = (fieldName: string, value: any) => {
    let errorMsgs: { [key: string]: string } = {};

    switch (fieldName) {
      case "name":
        errorMsgs.name = !value ? "Name is required" : "";
        break;
      case "applicationDueDate":
        if (!value) {
          errorMsgs.applicationDueDate = "Application due date is required.";
          break;
        }
        const appDate = new Date(value);
        const now = new Date();
        const appDateChanged = !areDatesEffectivelySame(
          value,
          originalDates.appDueDate,
        );
        if (appDateChanged && appDate <= now) {
          errorMsgs.applicationDueDate =
            "New application due date must be in future.";
          break;
        }
        if (
          formData.documentDueDate &&
          value &&
          new Date(formData.documentDueDate) < new Date(value)
        ) {
          errorMsgs.applicationDueDate =
            "New application due date must be on or before document submission deadline.";
          errorMsgs.documentDueDate =
            "New document submission deadline must be after application due date.";
          break;
        }
        errorMsgs.documentDueDate = "";
        errorMsgs.applicationDueDate = "";
        break;
      case "documentDueDate":
        if (!value) {
          errorMsgs.documentDueDate =
            "Document submission deadline is required.";
          break;
        }
        const docDate = new Date(value);
        const nowDoc = new Date();
        const docDateChanged = !areDatesEffectivelySame(
          value,
          originalDates.docDueDate,
        );
        if (docDateChanged && docDate <= nowDoc) {
          errorMsgs.documentDueDate = "Document due date must be in future.";
          break;
        }
        if (
          formData.applicationDueDate &&
          value &&
          new Date(formData.applicationDueDate) > new Date(value)
        ) {
          errorMsgs.applicationDueDate =
            "New application due date must be before document submission deadline.";
          errorMsgs.documentDueDate =
            "New document submission deadline must be after application due date.";
          break;
        }
        errorMsgs.applicationDueDate = "";
        errorMsgs.documentDueDate = "";
        break;
      case "undergradHourLimit":
        errorMsgs.undergradHourLimit =
          value <= 0 ? "Hour limit must be positive" : "";
        break;
      case "postgradHourLimit":
        errorMsgs.postgradHourLimit =
          value <= 0 ? "Hour limit must be positive" : "";
        break;
      case "undergradMailingList":
        errorMsgs.undergradMailingList =
          Array.isArray(value) && value.length > 0
            ? ""
            : "At least one undergraduate mailing list is required.";
        break;
      case "postgradMailingList":
        errorMsgs.postgradMailingList =
          Array.isArray(value) && value.length > 0
            ? ""
            : "At least one postgraduate mailing list is required.";
        break;
      default:
        break;
    }
    setInputErrors((prevErrors) => ({ ...prevErrors, ...errorMsgs }));
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
    >,
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
        "/user-management/groups/undergraduate",
      );
      if (response.status === 200) {
        setAllUndergradGroups(response.data);
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
        "/user-management/groups/postgraduate",
      );
      if (response.status === 200) {
        setAllPostgradGroups(response.data);
      } else {
        console.error("Failed to fetch postgraduate groups");
      }
    } catch (error) {
      console.error("Error fetching postgraduate groups:", error);
    }
  };

  const fetchRecruitmentRound = async () => {
    setIsLoading(true);
    if (!seriesId) {
      showToast("Invalid recruitment round ID", "error");
      setIsLoading(false);
      // navigate(-1);
      return;
    }

    // First check store
    let recruitmentRound = getRoundById(seriesId);

    // If not in store, fetch from API
    if (!recruitmentRound) {
      try {
        const response = await axiosInstance.get(
          `/recruitment-series/${seriesId}`,
        );
        if (response.status === 200) {
          recruitmentRound = response.data;
        } else {
          showToast("Failed to fetch recruitment round", "error");
          setIsLoading(false);
          // navigate(-1);
          return;
        }
      } catch (error) {
        console.error("Error fetching recruitment round:", error);
        showToast("Recruitment round not found", "error");
        setIsLoading(false);
        // navigate(-1);
        return;
      }
    }

    if (recruitmentRound) {
      const appDueDateValue = toLocalDatetimeInputValue(
        new Date(recruitmentRound.applicationDueDate),
      );
      const docDueDateValue = toLocalDatetimeInputValue(
        new Date(recruitmentRound.documentDueDate),
      );

      setFormData({
        name: recruitmentRound.name,
        applicationDueDate: appDueDateValue,
        documentDueDate: docDueDateValue,
        undergradHourLimit: recruitmentRound.undergradHourLimit,
        postgradHourLimit: recruitmentRound.postgradHourLimit,
        undergradMailingList: recruitmentRound.undergradMailingList,
        postgradMailingList: recruitmentRound.postgradMailingList,
        status: recruitmentRound.status,
      });
      const underCount = recruitmentRound.undergradMailingList.reduce(
        (sum: number, group: UserGroup) => sum + group.userCount,
        0,
      );
      const postCount = recruitmentRound.postgradMailingList.reduce(
        (sum: number, group: UserGroup) => sum + group.userCount,
        0,
      );
      setUsersCount({ under: underCount, post: postCount });
      setOriginalDates({
        appDueDate: appDueDateValue,
        docDueDate: docDueDateValue,
      });
      setIsLoading(false);
    }
  };

  const updateAvailableGroups = () => {
    // Filter out already selected groups from available options
    const selectedUndergradIds = formData.undergradMailingList.map(
      (g) => g._id,
    );
    const selectedPostgradIds = formData.postgradMailingList.map((g) => g._id);

    setAvailableUndergradGroups(
      allUndergradGroups.filter((g) => !selectedUndergradIds.includes(g._id)),
    );
    setAvailablePostgradGroups(
      allPostgradGroups.filter((g) => !selectedPostgradIds.includes(g._id)),
    );
  };

  const handleSubmit = async () => {
    console.log("Is form valid?", isFormValid());
    if (!isFormValid()) {
      const RSData = {
        name: formData.name,
        applicationDueDate: formData.applicationDueDate,
        documentDueDate: formData.documentDueDate,
        undergradHourLimit: formData.undergradHourLimit,
        postgradHourLimit: formData.postgradHourLimit,
        undergradMailingList: formData.undergradMailingList.map((g) => g._id),
        postgradMailingList: formData.postgradMailingList.map((g) => g._id),
      };
      console.log("Sending update data", RSData);
      try {
        if (!seriesId) {
          showToast("Invalid recruitment round ID", "error");
          return;
        }
        const response = await axiosInstance.put(
          `/recruitment-series/${seriesId}`,
          RSData,
        );
        if (response.status === 200) {
          showToast("Recruitment series updated successfully", "success");
          updateRound(seriesId, {
            name: response.data.recruitmentRound.name,
            status: response.data.recruitmentRound.status,
            applicationDueDate:
              response.data.recruitmentRound.applicationDueDate,
            documentDueDate: response.data.recruitmentRound.documentDueDate,
            undergradHourLimit:
              response.data.recruitmentRound.undergradHourLimit,
            postgradHourLimit: response.data.recruitmentRound.postgradHourLimit,
            undergradMailingList:
              response.data.recruitmentRound.undergradMailingList,
            postgradMailingList:
              response.data.recruitmentRound.postgradMailingList,
          });
          navigate("/admin-dashboard");
        } else {
          showToast("Failed to update recruitment series", "error");
          console.error("Failed to update recruitment series");
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || "Error updating recruitment series";
        showToast(errorMessage, "error");
        console.error("Error updating recruitment series:", error);
      }
    } else {
      showToast("Please fix errors in the form, before submitting", "error");
      Object.keys(formData).forEach((key) =>
        validateField(key, (formData as any)[key]),
      );
    }
  };

  useEffect(() => {
    fetchUndergradGroups();
    fetchPostgradGroups();
    fetchRecruitmentRound();
  }, [seriesId]);

  useEffect(() => {
    updateAvailableGroups();
  }, [
    allUndergradGroups,
    allPostgradGroups,
    formData.undergradMailingList,
    formData.postgradMailingList,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen-minusnav">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start p-4 min-h-screen bg-gradient-to-br from-primary-dark/10 to-primary-light/20">
      <div className="rounded-lg w-full max-w-4xl bg-bg-card shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-base-content select-none">
          Edit Recruitment Round
        </h2>

        <div className="flex flex-col gap-y-6">
          {/* Round Name */}
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
              className="ml-8 new-module-input min-w-[400px]"
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
              className="ml-5 max-w-[200px] input input-bordered"
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
              className="ml-5 max-w-[200px] input input-bordered"
            />
          </div>
          {inputErrors.documentDueDate && (
            <span className="text-warning text-sm ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
              {inputErrors.documentDueDate}
            </span>
          )}
        </div>

        {/* Update Module Deadlines Option */}
        {/* <div className="form-control mt-5">
          <label className="cursor-pointer label justify-start gap-x-4 ml-5">
            <input
              type="checkbox"
              name="updateModuleDeadlines"
              checked={formData.updateModuleDeadlines}
              onChange={handleChange}
              className="checkbox checkbox-primary"
            />
            <span className="label-text">
              Change the recruitment round's all module recruitments' deadlines
              to these
            </span>
          </label>
          <p className="text-text-secondary text-xs ml-12 mt-1">
            When checked, all modules in this recruitment series will have their
            deadlines updated to match the recruitment series deadlines.
          </p>
        </div> */}

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
                className="pl-2 text-text-primary focus:outline-0 pr-2 mr-2 border-0 border-r-2 border-r-text-secondary w-full"
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
                className="pl-2 text-text-primary focus:outline-0 pr-2 mr-2 border-0 border-r-2 border-r-text-secondary w-full"
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
          Potential TAs - <b>Undergraduates</b>
        </p>
        <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[30vh] overflow-hidden mx-2 mb-2">
          <div className="flex py-1 px-3 items-start shadow-md w-full gap-x-3">
            <p className="text-text-secondary ml-2 mt-3">User group: </p>
            <div className="flex p-1 flex-1 flex-col items-start">
              <GroupSelect
                options={availableUndergradGroups}
                selectedOption={null}
                onSelect={handleUndergradGroupSelect}
                className="min-w-full"
                placeholder="Select a User Group to add its users to the mailing list"
                width=""
              />
              {availableUndergradGroups.length === 0 && (
                <p className="text-orange-500 font-semibold text-xs mt-1">
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
                    const newUndergradList =
                      formData.undergradMailingList.filter(
                        (item) => item._id !== group._id,
                      );
                    validateField("undergradMailingList", newUndergradList);
                    setFormData((prev) => ({
                      ...prev,
                      undergradMailingList: newUndergradList,
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
          Potential TAs - <b>Postgraduates</b>
        </p>
        <div className="flex flex-col rounded-md outline outline-text-secondary/80 outline-1 h-[30vh] overflow-hidden mx-2 mb-2">
          <div className="flex py-1 px-3 items-start shadow-md w-full gap-x-3">
            <p className="text-text-secondary ml-2 mt-3">User group: </p>
            <div className="flex p-1 flex-1 flex-col items-start">
              <GroupSelect
                options={availablePostgradGroups}
                selectedOption={null}
                onSelect={handlePostgradGroupSelect}
                placeholder="Select a User Group to add its users to the mailing list"
                width=""
                className="min-w-full"
              />
              {availablePostgradGroups.length === 0 && (
                <p className="text-orange-500 font-semibold text-xs mt-1">
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
                    const newPostgradList = formData.postgradMailingList.filter(
                      (item) => item._id !== group._id,
                    );
                    validateField("postgradMailingList", newPostgradList);
                    setFormData((prev) => ({
                      ...prev,
                      postgradMailingList: newPostgradList,
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
            <span className="text-text-primary font-semibold">{` ${usersCount.post}`}</span>
          </p>
        </div>
        {inputErrors.postgradMailingList && (
          <span className="text-warning text-xs ml-8 bg-warning/10 py-1 px-3 w-fit rounded-sm">
            {inputErrors.postgradMailingList}
          </span>
        )}

        {/* Status Display */}
        <div className="form-control mt-5">
          <label className="label">
            <span className="label-text">Current Status</span>
          </label>
          <div className="ml-8 py-2 px-4 bg-gray-100 rounded-md">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.status === "initialised"
                  ? "bg-blue-100 text-blue-800"
                  : formData.status === "active"
                    ? "bg-green-100 text-green-800"
                    : formData.status === "closed"
                      ? "bg-yellow-100 text-yellow-800"
                      : formData.status === "archived"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-gray-100 text-gray-800"
              }`}
            >
              {formData.status?.charAt(0).toUpperCase() +
                formData.status?.slice(1)}
            </span>
          </div>
        </div>

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
            Update Recruitment Round
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditRecruitmentRound;
