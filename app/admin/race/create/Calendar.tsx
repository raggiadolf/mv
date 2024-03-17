"use client";
import classNames from "@/app/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { ScheduledRaceWithSegments } from "@/app/lib/db";
import {
  Button,
  CheckboxGroup,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  VisuallyHidden,
  useCheckbox,
  useDisclosure,
} from "@nextui-org/react";
import { Jersey } from "@/app/components/Jerseys";

const weekDays = ["Mán", "Þri", "Mið", "Fim", "Fös", "Lau", "Sun"];

export default function Calendar({
  schedule,
}: {
  schedule: ScheduledRaceWithSegments[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [weekDay, setWeekDay] = useState(5);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [openEvent, setOpenEvent] = useState<{
    title: string;
    start_time: string;
    jerseys: {
      key: "YELLOW" | "GREEN" | "POLKA" | "OLD";
      strava_id: number | null;
    }[];
  } | null>(null);
  console.log("openEvent", openEvent);

  useEffect(() => {
    if (container.current) {
      setContainerWidth(container.current.offsetWidth);
      const getWidth = () => {
        setContainerWidth(container.current?.offsetWidth || 0);
      };
      window.addEventListener("resize", getWidth);

      return () => window.removeEventListener("resize", getWidth);
    }
  }, []);

  const scheduleWithCalendarSlots = schedule.map((s) => {
    const daySlot = s.weekday + 1;
    const timeStart =
      parseInt(s.start_time.split(":")[0]) * 12 +
      2 +
      12 / (60 / parseInt(s.start_time.split(":")[1]));
    return {
      ...s,
      daySlot,
      timeStart,
    };
  });

  const clicked = (e: React.MouseEvent) => {
    const boundingClientRect = container.current?.getBoundingClientRect();
    const offsetX = e.clientX - boundingClientRect?.left!;
    const offsetY = e.clientY - boundingClientRect?.top!;
    const day = Math.floor(offsetX / (containerWidth / 7.15));
    console.log("day", weekDays[day]);
    const time = Math.floor(offsetY / (containerWidth / 47));
    console.log("time", time);
  };

  return (
    <div className="w-full px-2">
      <div>
        <div className="flex h-full flex-col">
          <div className="isolate flex flex-auto flex-col bg-white">
            <div
              style={{ width: "165%" }}
              className="flex max-w-full flex-none flex-col sm:max-w-none md:max-w-full"
            >
              <div className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black ring-opacity-5 sm:pr-8">
                <div className="grid grid-cols-7 text-sm leading-6 text-gray-500 sm:hidden">
                  {weekDays.map((day, index) => (
                    <button
                      type="button"
                      className="flex flex-col items-center pb-3 pt-2"
                      key={index}
                      onClick={() => setWeekDay(index)}
                    >
                      <span
                        className={classNames(
                          "mt-1 flex h-8 w-8 items-center justify-center font-semibold text-gray-900",
                          index === weekDay
                            ? "rounded-full bg-indigo-600 text-white"
                            : ""
                        )}
                      >
                        {day}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="-mr-px hidden grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm leading-6 text-gray-500 sm:grid">
                  <div className="col-end-1 w-14" />
                  <div className="flex items-center justify-center py-3">
                    <span>Mán</span>
                  </div>
                  <div className="flex items-center justify-center py-3">
                    <span>Þri</span>
                  </div>
                  <div className="flex items-center justify-center py-3">
                    <span className="flex items-baseline">Mið</span>
                  </div>
                  <div className="flex items-center justify-center py-3">
                    <span>Fim</span>
                  </div>
                  <div className="flex items-center justify-center py-3">
                    <span>Fös</span>
                  </div>
                  <div className="flex items-center justify-center py-3">
                    <span>Lau</span>
                  </div>
                  <div className="flex items-center justify-center py-3">
                    <span>Sun</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-auto">
                <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
                <div className="grid flex-auto grid-cols-1 grid-rows-1">
                  {/* Horizontal lines */}
                  <div
                    className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                    style={{
                      gridTemplateRows: "repeat(48, minmax(3.5rem, 1fr))",
                    }}
                  >
                    <div className="row-end-1 h-7"></div>
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        00:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        01:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        02:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        03:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        04:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        05:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        06:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        07:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        08:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        09:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        10:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        11:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        12:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        13:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        14:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        15:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        16:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        17:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        18:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        19:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        20:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        21:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        22:00
                      </div>
                    </div>
                    <div />
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                        23:00
                      </div>
                    </div>
                    <div />
                  </div>

                  {/* Vertical lines */}
                  <div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7">
                    <div className="col-start-1 row-span-full" />
                    <div className="col-start-2 row-span-full" />
                    <div className="col-start-3 row-span-full" />
                    <div className="col-start-4 row-span-full" />
                    <div className="col-start-5 row-span-full" />
                    <div className="col-start-6 row-span-full" />
                    <div className="col-start-7 row-span-full" />
                    <div className="col-start-8 row-span-full w-8" />
                  </div>

                  {/* Events */}
                  <div
                    className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7 sm:pr-8"
                    style={{
                      gridTemplateRows:
                        "1.75rem repeat(288, minmax(0, 1fr)) auto",
                    }}
                    onClick={(e) => clicked(e)}
                    ref={container}
                  >
                    {scheduleWithCalendarSlots.map((s) => (
                      <div
                        onClick={() => {
                          setOpenEvent({
                            title: s.title || "",
                            start_time: s.start_time,
                            jerseys: s.RaceSegment.map((r) => ({
                              key: r.jersey,
                              strava_id: Number(r.strava_segment_id),
                            })),
                          });
                          onOpen();
                        }}
                        key={s.id}
                        className={`relative mt-px flex col-start-${s.daySlot}`}
                        style={{
                          gridRow: `${s.timeStart} / span 12`,
                        }}
                      >
                        <div className="cursor-pointer group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-blue-50 p-2 text-xs leading-5 hover:bg-blue-100">
                          <p className="order-1 font-semibold text-blue-700">
                            {s.title}
                          </p>
                          <p className="text-blue-500 group-hover:text-blue-700">
                            <time dateTime={s.start_time}>{s.start_time}</time>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Breyta viðburði
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col space-y-4 p-2">
                  <Input
                    type="text"
                    label="Titill"
                    placeholder="Morgunvaktin"
                    defaultValue={openEvent?.title || ""}
                  />
                  <Input
                    type="text"
                    label="Rástími"
                    placeholder="06:10"
                    defaultValue={openEvent?.start_time || ""}
                  />
                  <div className="flex flex-col">
                    <CheckboxGroup
                      className="gap-1"
                      orientation="vertical"
                      value={openEvent?.jerseys.map((j) => j.key) || []}
                      onChange={(e) => {
                        if (typeof (e as string[]).map === "function") {
                          setOpenEvent({
                            ...openEvent!,
                            jerseys: (e as string[]).map((key) => ({
                              key: key as "YELLOW" | "GREEN" | "POLKA" | "OLD",
                              strava_id: null,
                            })),
                          });
                        }
                      }}
                    >
                      <div className="flex">
                        <CustomCheckbox value="YELLOW" jersey="YELLOW" />
                        <Input
                          isDisabled={
                            !openEvent?.jerseys.find((j) => j.key === "YELLOW")
                          }
                          label="Strava ID"
                          placeholder="12345678"
                          value={
                            openEvent?.jerseys
                              .find((j) => j.key === "YELLOW")
                              ?.strava_id?.toString() || ""
                          }
                          onValueChange={(e: string) => {
                            setOpenEvent({
                              ...openEvent!,
                              jerseys:
                                openEvent?.jerseys.map((j) =>
                                  j.key === "YELLOW"
                                    ? { ...j, strava_id: parseInt(e) }
                                    : j
                                ) || [],
                            });
                          }}
                        />
                      </div>
                      <div className="flex">
                        <CustomCheckbox value="OLD" jersey="OLD" />
                        <Input
                          isDisabled={
                            !openEvent?.jerseys.find((j) => j.key === "OLD")
                          }
                          label="Strava ID"
                          placeholder="12345678"
                          value={
                            openEvent?.jerseys
                              .find((j) => j.key === "OLD")
                              ?.strava_id?.toString() || ""
                          }
                          onValueChange={(e: string) => {
                            setOpenEvent({
                              ...openEvent!,
                              jerseys:
                                openEvent?.jerseys.map((j) =>
                                  j.key === "OLD"
                                    ? { ...j, strava_id: parseInt(e) }
                                    : j
                                ) || [],
                            });
                          }}
                        />
                      </div>
                      <div className="flex">
                        <CustomCheckbox value="GREEN" jersey="GREEN" />
                        <Input
                          isDisabled={
                            !openEvent?.jerseys.find((j) => j.key === "GREEN")
                          }
                          label="Strava ID"
                          placeholder="12345678"
                          value={
                            openEvent?.jerseys
                              .find((j) => j.key === "GREEN")
                              ?.strava_id?.toString() || ""
                          }
                          onValueChange={(e: string) => {
                            setOpenEvent({
                              ...openEvent!,
                              jerseys:
                                openEvent?.jerseys.map((j) =>
                                  j.key === "GREEN"
                                    ? { ...j, strava_id: parseInt(e) }
                                    : j
                                ) || [],
                            });
                          }}
                        />
                      </div>
                      <div className="flex">
                        <CustomCheckbox value="POLKA" jersey="POLKA" />
                        <Input
                          isDisabled={
                            !openEvent?.jerseys.find((j) => j.key === "POLKA")
                          }
                          label="Strava ID"
                          placeholder="12345678"
                          value={
                            openEvent?.jerseys
                              .find((j) => j.key === "POLKA")
                              ?.strava_id?.toString() || ""
                          }
                          onValueChange={(e: string) => {
                            setOpenEvent({
                              ...openEvent!,
                              jerseys:
                                openEvent?.jerseys.map((j) =>
                                  j.key === "POLKA"
                                    ? { ...j, strava_id: parseInt(e) }
                                    : j
                                ) || [],
                            });
                          }}
                        />
                      </div>
                    </CheckboxGroup>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Vista
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

const CustomCheckbox = (props: any) => {
  const { isSelected, getBaseProps, getInputProps } = useCheckbox({
    ...props,
  });

  return (
    <label {...getBaseProps()}>
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <Jersey
        jersey={props.jersey as "YELLOW" | "GREEN" | "POLKA" | "OLD" | null}
        className={classNames(
          "w-8 h-8",
          isSelected ? "opacity-100" : "opacity-25"
        )}
      />
    </label>
  );
};
