// import { useEffect, useState } from "react";
import { useStdout } from "ink";

export function useStdoutDimensions(){
  const { stdout } = useStdout();
//   const [dimensions, setDimensions] = useState<[number, number]>([
//     stdout.columns,
//     stdout.rows,
//   ]);

//   useEffect(() => {
//     const handler = () => setDimensions([stdout.columns, stdout.rows]);
//     stdout.on("resize", handler);
//     return () => {
//       stdout.off("resize", handler);
//     };
//   }, [stdout]);

  return { columns: stdout.columns, rows: stdout.rows };
}
