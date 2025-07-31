import { useState, useEffect } from "react";
import Comment from "./Comment";
import { blogpostService } from "../../services/blogpost.service";
import type { CommentWithReplies } from "../../types";

interface CommentsSectionProps {
  blogPostUrl: string;
  currentUsername?: string;
}

function CommentsSection({
  blogPostUrl,
  currentUsername,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch comments on component mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await blogpostService.getCommentsForBlogPost(
          blogPostUrl
        );
        setComments(response.data);
      } catch (err) {
        setError("Failed to load comments");
        console.error("Error fetching comments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [blogPostUrl]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const new_comment = await blogpostService.createComment(blogPostUrl, {
        content: newComment.trim(),
        reply_to: null,
      });

      // Add new comment to local state
      setComments((prevComments) => [
        {
          id: new_comment.id,
          content: new_comment.content,
          comment_date: new_comment.comment_date,
          blog_post_id: new_comment.blog_post_id,
          reply_to: new_comment.reply_to,
          username: new_comment.username,
          replies: [],
        },
        ...prevComments,
      ]);
      setNewComment("");
    } catch (err) {
      console.error("Error creating comment:", err);
      setError("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (id: number, newContent: string) => {
    try {
      const updated_comment = await blogpostService.updateComment(
        blogPostUrl,
        id,
        {
          content: newContent,
        }
      );

      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === id
            ? { ...comment, content: updated_comment.content }
            : comment
        )
      );
    } catch (err) {
      console.error("Error updating comment:", err);
      setError("Failed to update comment");
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      await blogpostService.deleteComment(blogPostUrl, id);

      // Remove from local state
      setComments(comments.filter((comment) => comment.id !== id));
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    try {
      const new_comment = await blogpostService.createComment(blogPostUrl, {
        content: content,
        reply_to: parentId,
      });

      // Add new reply to local state
      setComments(
        comments.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...comment.replies, new_comment] }
            : comment
        )
      );
    } catch (err) {
      console.error("Error creating reply:", err);
      setError("Failed to post reply");
    }
  };

  const handleEditReply = async (
    parentId: number,
    replyId: number,
    newContent: string
  ) => {
    try {
      const updated_comment = await blogpostService.updateComment(
        blogPostUrl,
        replyId,
        {
          content: newContent,
        }
      );

      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === replyId
                    ? { ...reply, content: updated_comment.content }
                    : reply
                ),
              }
            : comment
        )
      );
    } catch (err) {
      console.error("Error updating reply:", err);
      setError("Failed to update reply");
    }
  };

  const handleDeleteReply = async (parentId: number, replyId: number) => {
    try {
      await blogpostService.deleteComment(blogPostUrl, replyId);

      // Remove from local state
      setComments(
        comments.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies.filter(
                  (reply) => reply.id !== replyId
                ),
              }
            : comment
        )
      );
    } catch (err) {
      console.error("Error deleting reply:", err);
      setError("Failed to delete reply");
    }
  };

  // Number of total comments including replies
  const totalCommentsCount = comments.reduce((total, comment) => {
    return total + 1 + comment.replies.length;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto mt-12 px-4">
      {/* Comments header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Comments ({totalCommentsCount})
        </h2>
        <div className="w-16 h-1 bg-blue-600 rounded"></div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-600 hover:text-red-800 text-sm underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Post Comment form */}
      <form className="mb-8" onSubmit={handleSubmitComment}>
        <div>
          <textarea
            value={newComment}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 1000) {
                setNewComment(value);
              }
            }}
            placeholder="Leave a comment..."
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            rows={4}
            maxLength={1000}
            disabled={isSubmitting || loading}
          />
          <div className="flex justify-between items-center mt-1">
            <span
              className={`text-xs ${
                newComment.length > 990 ? "text-red-500" : "text-gray-500"
              }`}
            >
              {newComment.length}/1000 characters
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={
            !newComment.trim() ||
            newComment.length > 1000 ||
            isSubmitting ||
            loading
          }
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-3"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* During loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : (
        /* Comments */
        <div>
          {comments.length === 0 ? (
            <div className="text-center pt-4 py-12">
              <p className="text-gray-500">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <Comment
                key={comment.id}
                id={comment.id}
                username={comment.username}
                content={comment.content}
                commentDate={comment.comment_date}
                currentUsername={currentUsername}
                replies={comment.replies.map((reply) => ({
                  id: reply.id,
                  username: reply.username,
                  content: reply.content,
                  commentDate: reply.comment_date,
                }))}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onReply={handleReply}
                onEditReply={handleEditReply}
                onDeleteReply={handleDeleteReply}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CommentsSection;
