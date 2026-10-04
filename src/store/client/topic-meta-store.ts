import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TopicMetaState {
  logos: Record<string, string>;
  setLogo: (topicId: string, logo: string | null) => void;
  getLogo: (topicId: string) => string | null;
}

export const useTopicMetaStore = create<TopicMetaState>()(
  persist(
    (set, get) => ({
      logos: {},
      setLogo: (topicId, logo) =>
        set((state) => {
          const logos = { ...state.logos };
          if (logo) logos[topicId] = logo;
          else delete logos[topicId];
          return { logos };
        }),
      getLogo: (topicId) => get().logos[topicId] ?? null,
    }),
    {
      name: "learnflow-topic-meta",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ logos: state.logos }),
    },
  ),
);
