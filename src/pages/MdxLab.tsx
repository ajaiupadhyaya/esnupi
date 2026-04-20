import Hello from "@/content/hello.mdx";
import { DateTime } from "luxon";
import { Link } from "react-router-dom";
import "./mdx-lab.css";

export default function MdxLab() {
  const date = DateTime.now().toFormat("dd LLL yyyy");
  return (
    <div className="mdx-lab">
      <div className="mdx-lab__paper">
        <div className="mdx-lab__stamp" aria-hidden>
          <div className="mdx-lab__stamp-inner">
            <div className="mdx-lab__stamp-line">printed on</div>
            <div className="mdx-lab__stamp-date">{date}</div>
            <div className="mdx-lab__stamp-sub">esnupi · lab</div>
          </div>
        </div>
        <article className="mdx-lab__article">
          <Hello />
        </article>
        <p className="mdx-lab__back">
          <Link to="/" className="mdx-lab__keycap">
            <kbd>← Return to desktop</kbd>
          </Link>
        </p>
      </div>
    </div>
  );
}
