import { useEffect, useState } from "react";

const STATEMENT =
  `on the day i learned the word 'ambient' i was sitting on my grandmother's rug
and the television was tuned to static and my cousin was painting a sailboat
onto a paper plate. i did not know any of this mattered until much later.

the internet was a sound you could hear from two rooms away. whatever i was
going to become had already started, silently, at the corner of some garage.

i keep trying to make objects you can hold with your eyes. it is all i know
how to do. if you are reading this at three in the morning, i am glad.

— the artist, 1998 / 2026`;

/** Konami code unlocks this panel. */
export function SecretPanel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= STATEMENT.length) return;
    const id = window.setTimeout(() => setI((x) => x + 1), 22);
    return () => window.clearTimeout(id);
  }, [i]);
  return (
    <section className="mac-secret" aria-label="private collection">
      <h3 className="mac-secret__title">— private collection —</h3>
      <pre className="mac-secret__body">{STATEMENT.slice(0, i)}<span className="mac-secret__cursor">█</span></pre>
    </section>
  );
}
