import type { UserGroup } from "./users";
import type { ModuleDetails } from "./module";

export type RecruitmentRoundStatus =
  | "initialised"
  | "active"
  | "closed"
  | "archived";

export interface RecruitmentRound {
  _id: string;
  name: string;
  applicationDueDate: string;
  documentDueDate: string;
  undergradHourLimit: number;
  postgradHourLimit: number;
  undergradMailingList: UserGroup[];
  postgradMailingList: UserGroup[];
  status: RecruitmentRoundStatus;
};

export interface RecruitmentRoundState extends RecruitmentRound {
  className?: string;
  areModulesLoading: boolean;
  areModulesFetched: boolean;
  lastRefreshedAt?: string;
  modules: Record<string, ModuleDetails> | null;
  error: string | null;
}
