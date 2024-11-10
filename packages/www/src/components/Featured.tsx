import Image from "next/legacy/image";

import { Tooltip } from "./hexta-ui/Tooltip";
import { MagneticButton } from "./MagneticButton";

interface WorkCardProps {
  title: string;
  description: string;
  imgSrc: string;
  imgAlt: string;
  url: string;
}

export const WorkCard = ({
  title,
  description,
  imgSrc,
  imgAlt,
  url,
}: WorkCardProps) => {
  return (
    <>
      <div
        onClick={() => window.open(url, "_blank")}
        className="p-3  flex gap-7 flex-col  rounded-2xl"
        id="Projects"
      >
        <div>
          <Image
            src={imgSrc}
            alt={imgAlt}
            width={1920}
            height={1080}
            className="rounded-2xl mb-2 max-w-full h-auto w-full "
            objectFit="cover"
          />
        </div>
        <hr className="opacity-30" />
        <div className="flex justify-between items-center gap-4">
          <div>
            <p className="text-3xl font-bold py-1">{title}</p>
            <p className="text-sm opacity-80">{description}</p>
          </div>
          <Tooltip text="view project">
            <MagneticButton>
              <div className="p-3 border rounded-full bg-white text-black flex items-center justify-center cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M6.4 18L5 16.6L14.6 7H6V5h12v12h-2V8.4z"
                  />
                </svg>
              </div>
            </MagneticButton>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export const Featured = () => {
  const works = [
    {
      title: "Lorem Ipsum",
      description:
        "Reprehenderit magna est amet magna do non. Enim dolore nostrud incididunt non nulla dolor pariatur ullamco aliqua cillum ad enim.",
      imgSrc: "https://source.unsplash.com/random/1920x1080?website+mockup",
      imgAlt: "Lorem Ipsum",
      url: "https://ui.hextastudio.in",
    },
    {
      title: "Lorem Ipsum",
      description:
        "Reprehenderit magna est amet magna do non. Enim dolore nostrud incididunt non nulla dolor pariatur ullamco aliqua cillum ad enim.",
      imgSrc: "https://source.unsplash.com/random/1920x1080?product+mockup",
      imgAlt: "Lorem Ipsum",
      url: "https://ui.hextastudio.in",
    },
    {
      title: "Lorem Ipsum",
      description:
        "Reprehenderit magna est amet magna do non. Enim dolore nostrud incididunt non nulla dolor pariatur ullamco aliqua cillum ad enim.",
      imgSrc: "https://source.unsplash.com/random/1920x1080?phone+mockup",
      imgAlt: "Lorem Ipsum",
      url: "https://ui.hextastudio.in",
    },
  ];

  return (
    <>
      <section className="min-h-screen flex items-start justify-start flex-col px-[5rem] max-[565px]:px-[1rem] gap-6 overflow-hidden mb-[8rem]">
        <h2 className="text-5xl font-bold bricolage-fonts">Featured work</h2>
        <div className="mt-[1rem] flex flex-col gap-6">
          {works.map((work, index) => (
            <WorkCard
              key={index}
              url={work.url}
              title={work.title}
              description={work.description}
              imgSrc={work.imgSrc}
              imgAlt={work.imgAlt}
            />
          ))}
        </div>
      </section>
    </>
  );
};
