import { useState } from "react";
import ConfirmDialog from "../Common/ConfirmDialog";

interface ReplyData {
  id: number;
  username: string;
  content: string;
  commentDate: string;
}

interface CommentProps {
  id: number;
  username: string;
  content: string;
  commentDate: string;
  currentUsername?: string;
  replies: ReplyData[];
  onEdit: (id: number, newContent: string) => void;
  onDelete: (id: number) => void;
  onReply: (parentId: number, content: string) => void;
  onEditReply: (parentId: number, replyId: number, newContent: string) => void;
  onDeleteReply: (parentId: number, replyId: number) => void;
}

function Comment({
  id,
  username,
  content,
  commentDate,
  currentUsername,
  replies = [],
  onEdit,
  onDelete,
  onReply,
  onEditReply,
  onDeleteReply,
}: CommentProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(content);
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>("");
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteReplyId, setDeleteReplyId] = useState<number | null>(null);

  const isOwner = username === currentUsername;

  const handleSaveEdit = () => {
    if (editContent.trim() !== content) {
      onEdit(id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(id, replyContent.trim());
      setReplyContent("");
      setIsReplying(false);
    }
  };

  const handleEditReply = (replyId: number, currentContent: string) => {
    setEditingReplyId(replyId);
    setEditingReplyContent(currentContent);
  };

  const handleSaveReplyEdit = () => {
    if (editingReplyContent.trim() && editingReplyId) {
      onEditReply(id, editingReplyId, editingReplyContent.trim());
      setEditingReplyId(null);
      setEditingReplyContent("");
    }
  };

  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditingReplyContent("");
  };

  const handleDeleteReply = (replyId: number) => {
    setDeleteReplyId(replyId);
  };

  const confirmDeleteReply = () => {
    if (deleteReplyId) {
      onDeleteReply(id, deleteReplyId);
      setDeleteReplyId(null);
    }
  };

  const cancelDeleteReply = () => {
    setDeleteReplyId(null);
  };

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        {/* Avatar and username */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-900">
              {isOwner ? "You" : username}
            </span>
            <span className="text-gray-500 text-sm ml-2">
              {new Date(commentDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Comment content */}
        {isEditing ? (
          <div className="space-y-3 mb-4">
            <div>
              <textarea
                value={editContent}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 1000) {
                    setEditContent(value);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={1000}
                placeholder="Write your comment..."
              />
              <div className="flex justify-between items-center mt-1">
                <span
                  className={`text-xs ${
                    editContent.length > 990 ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  {editContent.length}/1000 characters
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || editContent.length > 1000}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-800 leading-relaxed mb-4">{content}</div>
        )}

        {/* Comment action buttons */}
        {!isEditing && (
          <div className="flex space-x-4">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Reply
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="ml-8 mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div>
            <textarea
              value={replyContent}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1000) {
                  setReplyContent(value);
                }
              }}
              placeholder="Write a reply..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <span
                className={`text-xs ${
                  replyContent.length > 950 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {replyContent.length}/1000 characters
              </span>
            </div>
          </div>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || replyContent.length > 1000}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm font-medium"
            >
              Reply
            </button>
            <button
              onClick={() => {
                setIsReplying(false);
                setReplyContent("");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-8 mt-4 space-y-3">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4"
            >
              {/* Reply header */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {reply.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {isOwner ? "You" : reply.username}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    {new Date(reply.commentDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Reply content */}
              {editingReplyId === reply.id ? (
                <div className="space-y-3">
                  <div>
                    <textarea
                      value={editingReplyContent}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 1000) {
                          setEditingReplyContent(value);
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span
                        className={`text-xs ${
                          editingReplyContent.length > 990
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {editingReplyContent.length}/1000 characters
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveReplyEdit}
                      disabled={
                        !editingReplyContent.trim() ||
                        editingReplyContent.length > 1000
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelReplyEdit}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-gray-800 leading-relaxed mb-1">
                    {reply.content}
                  </div>

                  {/* Reply action buttons */}
                  {reply.username === currentUsername && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleEditReply(reply.id, reply.content)}
                        className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Comment confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Delete Reply confirmation */}
      <ConfirmDialog
        isOpen={deleteReplyId !== null}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteReply}
        onCancel={cancelDeleteReply}
      />
    </div>
  );
}

export default Comment;
