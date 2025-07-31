import type { BlogPost as BlogPostType } from "../../types/blogpost";
import { BLOGPOSTS_IMAGE_PATH } from "../../types/blogpost";
import MarkdownContentProps from "./MarkdownContent";

interface BlogPostProps {
  blogPost: BlogPostType;
}

function BlogPost({ blogPost }: BlogPostProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pt-6 flex-grow">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">
        {blogPost.title}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {new Date(blogPost.publication_date).toLocaleDateString()}
      </p>

      <img
        src={`${BLOGPOSTS_IMAGE_PATH}/${blogPost.image_path}`}
        alt={blogPost.title}
        className="w-full h-auto rounded-lg shadow-md mb-6"
      />

      <article className="prose prose-blue max-w-none mt-8">
        <MarkdownContentProps content={blogPost.content} />
      </article>
    </div>
  );
}

export default BlogPost;
