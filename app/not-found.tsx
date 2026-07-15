import Link from "next/link";

const copy = {
  title: "\u9875\u9762\u4e0d\u5b58\u5728",
  description: "\u8bf7\u8fd4\u56de\u9996\u9875\u7ee7\u7eed\u64cd\u4f5c\u3002",
  back: "\u8fd4\u56de\u9996\u9875"
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-field px-4">
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">{copy.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">{copy.description}</p>
        <Link className="mt-5 inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-sm font-semibold text-white" href="/buyer">
          {copy.back}
        </Link>
      </div>
    </main>
  );
}
