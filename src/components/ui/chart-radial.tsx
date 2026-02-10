"use client"

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

interface ChartRadialProps {
  quarter: number
  percentage: number
  anggaran: number
  terpakai: number
  sisa: number
}

export function ChartRadial({ quarter, percentage, anggaran, terpakai, sisa }: ChartRadialProps) {
  const chartData = [
    { 
      name: "penyerapan", 
      value: percentage, 
      fill: percentage >= 80 ? "hsl(142, 76%, 36%)" : percentage >= 40 ? "hsl(48, 96%, 53%)" : "hsl(0, 84%, 60%)"
    },
  ]

  const chartConfig = {
    penyerapan: {
      label: "Penyerapan",
    },
  } satisfies ChartConfig

  return (
    <Card className="flex flex-col border">
      <CardHeader className="items-center pb-0 p-2 md:p-6 md:pb-0">
        <CardTitle className="text-xs md:text-sm font-medium">Kuartal {quarter}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-2 md:pb-4 p-2 md:p-6 pt-0 md:pt-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 + (percentage / 100) * 360}
            innerRadius={60}
            outerRadius={90}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[66, 54]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-xl md:text-3xl font-bold"
                        >
                          {percentage.toFixed(1)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                          className="fill-muted-foreground text-[8px] md:text-xs"
                        >
                          Outlook
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
        <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1">
          <div className="flex justify-between text-[12px] md:text-sm gap-1">
            <span className="text-muted-foreground shrink-0">Anggaran</span>
            <span className="text-blue-600 font-medium truncate">{anggaran.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[12px] md:text-sm gap-1">
            <span className="text-muted-foreground shrink-0">Terpakai</span>
            <span className="text-red-600 font-medium truncate">{terpakai.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[12px] md:text-sm border-t pt-0.5 md:pt-1 gap-1">
            <span className="font-medium shrink-0">Sisa</span>
            <span className={`font-bold truncate ${sisa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {sisa.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
