import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityChart() {
  return (
    <div className="h-48 w-full max-w-md">
      <Line
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Playground activity (demo)",
              color: "hsl(40 15% 88%)",
              font: { size: 12 },
            },
          },
          scales: {
            x: {
              ticks: { color: "hsl(240 6% 58%)" },
              grid: { color: "hsl(240 5% 18%)" },
            },
            y: {
              ticks: { color: "hsl(240 6% 58%)" },
              grid: { color: "hsl(240 5% 18%)" },
            },
          },
        }}
        data={{
          labels,
          datasets: [
            {
              label: "experiments",
              data: [3, 5, 4, 8, 6, 9, 7],
              borderColor: "hsl(32 90% 55%)",
              backgroundColor: "hsla(32, 90%, 55%, 0.12)",
              fill: true,
              tension: 0.35,
            },
          ],
        }}
      />
    </div>
  );
}
