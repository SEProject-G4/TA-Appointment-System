import { create } from "zustand";
import axiosInstance from "../api/axiosConfig";

//types
//types
import type { ModuleDetails } from "../types/module";
import type { RecruitmentRoundState } from "../types/recruitment-round";

interface RoundsState {
  rounds: Record<string, RecruitmentRoundState>;
  isInitiallyFetched: boolean;
  isFetching: boolean;
  fetchRounds: () => Promise<void>;
  getRoundById: (id: string) => RecruitmentRoundState | undefined;
  fetchInitialModules: () => Promise<void>;
  fetchModulesForRound: (roundId: string, updating?: boolean) => Promise<void>;
  getModuleById: (
    roundId: string,
    moduleId: string
  ) => ModuleDetails | undefined;
  addRound: (round: RecruitmentRoundState) => void;
  deleteRound: (roundId: string) => void;
  updateRound: (
    roundId: string,
    updates: Partial<RecruitmentRoundState>
  ) => void;
  addModuleToRound: (roundId: string, module: ModuleDetails) => void;
  updateModuleInRound: (
    roundId: string,
    moduleId: string,
    updates: Partial<ModuleDetails>
  ) => void;
  deleteModuleFromRound: (roundId: string, moduleId: string) => void;
  hasModulesWithStatusInRound: (roundId: string, status: string) => boolean;
}

export const useRoundsStore = create<RoundsState>((set, get) => ({
  rounds: {},
  isInitiallyFetched: false,
  isFetching: false,
  fetchRounds: async () => {
    // Prevent duplicate calls
    const state = get();
    if (state.isFetching || state.isInitiallyFetched) {
      console.log("fetchRounds: Already fetching or fetched, skipping");
      return;
    }

    set({ isFetching: true });

    try {
      const response = await axiosInstance.get("/recruitment-series");
      if (response.status === 200) {
        const roundsData: Record<string, RecruitmentRoundState> = {};
        response.data.forEach((round: any) => {
          roundsData[round._id] = {
            _id: round._id,
            name: round.name,
            applicationDueDate: round.applicationDueDate,
            documentDueDate: round.documentDueDate,
            undergradHourLimit: round.undergradHourLimit,
            postgradHourLimit: round.postgradHourLimit,
            undergradMailingList: round.undergradMailingList,
            postgradMailingList: round.postgradMailingList,
            status: round.status,
            moduleCount: round.moduleCount,
            undergraduateTAPositionsCount: round.undergraduateTAPositionsCount,
            postgraduateTAPositionsCount: round.postgraduateTAPositionsCount,
            areModulesLoading: round.status === "active" || round.status === "initialised",
            areModulesFetched: false,
            modules: null,
            error: null,
          };
        });
        set({ rounds: roundsData, isInitiallyFetched: true, isFetching: false });
      } else {
        set({ isFetching: false });
      }
    } catch (error) {
      console.error("Error fetching recruitment rounds:", error);
      set({ isFetching: false });
    }
  },

  getRoundById: (id: string) => {
    const rounds = get().rounds;
    return rounds[id];
  },

  fetchInitialModules: async () => {
    // Get the current state of rounds
    const currentState = get();
    const rounds = currentState.rounds;
    
    // If no rounds yet, skip
    if (Object.keys(rounds).length === 0) {
      console.log("No rounds available yet, skipping module fetch");
      return;
    }

    const roundIds = Object.values(rounds).filter(
      (round) => round.status === "active" || round.status === "initialised"
    ).map((round) => round._id);

    // If no active/initialised rounds, skip
    if (roundIds.length === 0) {
      console.log("No active or initialised rounds to fetch modules for");
      return;
    }

    try{
        const response = await axiosInstance.post("/recruitment-series/modules/batch", {
        roundIds,
      });
        const modulesByRound: Record<string, ModuleDetails[]> = response.data;
        
        // Update all rounds in a single setState call to avoid multiple renders
        set((state) => {
          const updatedRounds = { ...state.rounds };
          
          for (const roundId of roundIds) {
            if (updatedRounds[roundId]) {
              const modules = modulesByRound[roundId] || [];
              const modulesMap: Record<string, ModuleDetails> = {};
              modules.forEach((module) => {
                modulesMap[module._id] = module;
              });
              
              updatedRounds[roundId].modules = modulesMap;
              updatedRounds[roundId].areModulesLoading = false;
              updatedRounds[roundId].areModulesFetched = true;
              updatedRounds[roundId].lastRefreshedAt = new Date().toISOString();
              updatedRounds[roundId].error = null;
            }
          }
          
          return { rounds: updatedRounds };
        });
    } catch (error) {
        console.error("Error fetching initial modules:", error);
        
        // Set error state for all rounds that were attempted
        set((state) => {
          const updatedRounds = { ...state.rounds };
          roundIds.forEach((roundId) => {
            if (updatedRounds[roundId]) {
              updatedRounds[roundId].areModulesLoading = false;
              updatedRounds[roundId].error = (error as Error).message;
            }
          });
          return { rounds: updatedRounds };
        });
    }
  },

  fetchModulesForRound: async (roundId: string, updating?: boolean) => {
    if (updating !== true) {
      set((state) => {
        const updatedRounds = { ...state.rounds };
        if (updatedRounds[roundId]) {
          updatedRounds[roundId].areModulesLoading = true;
        }
        return { rounds: updatedRounds };
      });
    }

    try {
      const response = await axiosInstance.get(
        `/recruitment-series/${roundId}/modules`
      );

      const modules = response.data as ModuleDetails[];

      set((state) => {
        const updatedRounds = { ...state.rounds };
        if (updatedRounds[roundId]) {
          const modulesMap: Record<string, ModuleDetails> = {};
          modules.forEach((module) => {
            modulesMap[module._id] = module;
          });
          updatedRounds[roundId].modules = modulesMap;
          updatedRounds[roundId].areModulesLoading = false;
          updatedRounds[roundId].areModulesFetched = true;
          updatedRounds[roundId].lastRefreshedAt = new Date().toISOString();
          updatedRounds[roundId].error = null;
        } else {
          console.warn(`Round with ID ${roundId} not found in store.`);
        }
        return { rounds: updatedRounds };
      });
    } catch (error) {
      console.error("Error fetching modules for round:", error);
      set((state) => {
        const updatedRounds = { ...state.rounds };
        if (updatedRounds[roundId]) {
          updatedRounds[roundId].error = (error as Error).message;
          updatedRounds[roundId].areModulesLoading = false;
          updatedRounds[roundId].areModulesFetched = true;
        }
        return { rounds: updatedRounds };
      });
    }
  },

  getModuleById: (roundId: string, moduleId: string) => {
    const rounds = get().rounds;
    const round = rounds[roundId];
    if (!round || !round.modules) return undefined;
    return round.modules[moduleId];
  },

  addRound: (round: RecruitmentRoundState) => {
    set((state) => ({
      rounds: {
        ...state.rounds,
        [round._id]: round,
      },
    }));
  },

  deleteRound: (roundId: string) => {
    set((state) => {
      const updatedRounds = { ...state.rounds };
      delete updatedRounds[roundId];
      return { rounds: updatedRounds };
    });
  },

  updateRound: (roundId: string, updates: Partial<RecruitmentRoundState>) => {
    set((state) => {
      const updatedRounds = { ...state.rounds };
      if (updatedRounds[roundId]) {
        updatedRounds[roundId] = {
          ...updatedRounds[roundId],
          ...updates,
        };
      }
      return { rounds: updatedRounds };
    });
  },
  addModuleToRound: (roundId: string, module: ModuleDetails) => {
    set((state) => {
      const updatedRounds = { ...state.rounds }; 
      if (updatedRounds[roundId]) {
        const currentModules = updatedRounds[roundId].modules || {};
        updatedRounds[roundId].modules = {
          ...currentModules,
          [module._id]: module,
        };
      }
      return { rounds: updatedRounds };
    });
  },
  updateModuleInRound: (
    roundId: string,
    moduleId: string,
    updates: Partial<ModuleDetails>
  ) => {
    set((state) => {
      const updatedRounds = { ...state.rounds };
      if (updatedRounds[roundId] && updatedRounds[roundId].modules) {
        const currentModule = updatedRounds[roundId].modules![moduleId];
        if (currentModule) {
          // Create new round and modules objects to trigger React updates
          updatedRounds[roundId] = {
            ...updatedRounds[roundId],
            modules: {
              ...updatedRounds[roundId].modules,
              [moduleId]: {
                ...currentModule,
                ...updates,
              },
            },
          };
        }
      }
      return { rounds: updatedRounds };
    });
  },
  deleteModuleFromRound: (roundId: string, moduleId: string) => {
    set((state) => {
      const updatedRounds = { ...state.rounds };
      if (updatedRounds[roundId] && updatedRounds[roundId].modules) {
        const updatedModules = { ...updatedRounds[roundId].modules };
        delete updatedModules[moduleId];
        updatedRounds[roundId].modules = updatedModules;
      }
      return { rounds: updatedRounds };
    });
  },
  hasModulesWithStatusInRound: (roundId: string, status: string) => { 
    const rounds = get().rounds;
    const round = rounds[roundId];
    if (!round || !round.modules) return false;
    return Object.values(round.modules).some(
      (module) => module.moduleStatus === status
    );
  },
}));