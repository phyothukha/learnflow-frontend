export interface TopicFolder {
  Id: string;
  TopicId: string;
  ParentFolderId: string | null;
  Name: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface TopicFolderTreeNode {
  Id: string;
  TopicId: string;
  ParentFolderId: string | null;
  Name: string;
  Children: TopicFolderTreeNode[];
}

export interface CreateTopicFolderPayload {
  TopicId: string;
  ParentFolderId?: string;
  Name: string;
}

export type UpdateTopicFolderPayload = Partial<
  Pick<CreateTopicFolderPayload, "Name">
>;
