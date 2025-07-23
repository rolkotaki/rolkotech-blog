import { Link } from "react-router-dom";
import { BLOGPOSTS_IMAGE_PATH } from "../../types/blogposts";

interface BlogPostBoxProps {
  url: string;
  title: string;
  imagePath: string;
  publicationDate: string;
  tags: string[];
  content: string;
}

function BlogPostBox({
  url,
  title,
  imagePath,
  publicationDate,
  tags,
  content,
}: BlogPostBoxProps) {
  return (
    <div className="bg-white rounded-lg shadow transition transform hover:scale-[1.02] hover:shadow-xl cursor-pointer duration-200 overflow-hidden">
      <Link to={`/articles/${url}`} className="block">
        <img
          src={`${BLOGPOSTS_IMAGE_PATH}/${imagePath}`}
          alt={title}
          className="w-full h-40 object-cover"
        />
        <div className="p-5">
          <p className="text-sm text-gray-400 mb-1">{publicationDate}</p>
          <h3 className="text-xl font-semibold text-blue-700 mb-2">{title}</h3>
          <p className="text-gray-600 mb-3">{content}</p>
          {tags.map((tag, idx) => (
            <>
              <span
                key={tag}
                className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
              {idx < tags.length - 1 && <span>&nbsp;</span>}
            </>
          ))}
        </div>
      </Link>
    </div>
  );
}

export default BlogPostBox;
