import { World } from "tsworld";
import { Wave, WaveProcessing, GenerateWave } from "utauwav";

function loadWav(result: ArrayBuffer): Array<number> {
  console.log("load wav");
  const wav = new Wave(result as ArrayBuffer);
  wav.RemoveDCOffset();
  const ndata = wav.LogicalNormalize(1);
  return ndata as Array<number>;
}

function worldProcess(
  world: World,
  ndata: Array<number>,
  resultBox:HTMLElement
): Array<number> | null {
  console.log("harvest");
  resultBox.innerHTML += "f0分析：harvest実行中<br />";
  const harvest_result = world.Harvest(Float64Array.from(ndata), 44100, 5);
  if (!harvest_result) return null;
  resultBox.innerHTML += "harvest完了<br />";
  console.log("cheaptrick");
  resultBox.innerHTML += "スペクトラム分析:cheaptrick実行中<br />";
  const cheaptrick_result = world.CheapTrick(
    Float64Array.from(ndata),
    harvest_result.f0,
    harvest_result.time_axis,
    44100
  );
  resultBox.innerHTML += "cheaptrick完了<br />";
  if (!cheaptrick_result) return null;
  console.log("d4c");
  resultBox.innerHTML += "非周期性指標分析:d4c実行中<br />";
  const d4c_result = world.D4C(
    Float64Array.from(ndata),
    harvest_result.f0,
    harvest_result.time_axis,
    2048,
    44100,
    0.85
  ) as Array<Float64Array>;
  resultBox.innerHTML += "d4c完了<br />";
  console.log("Synthesis");
  resultBox.innerHTML += "合成中<br />";
  const result = world.Synthesis(
    harvest_result.f0,
    cheaptrick_result.spectral,
    d4c_result,
    cheaptrick_result.fft_size,
    44100,
    5.0
  );
  if (!result) return null;
  resultBox.innerHTML += "合成完了<br />";
  return Array.from(result);
}

function main() {
  const inputFile = document.getElementById("input-file");
  const resultButton = document.getElementById("result-button");
  const resultBox = document.getElementById("read-result");

  const resultFiles = new Array();
  if (!inputFile) return;
  if (!resultButton) return;
  if (!resultBox) return;
  inputFile.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    const fr = new FileReader();
    if (!target.files) return;
    Array.from(target.files).forEach((f) => {
      fr.addEventListener("load", async () => {
        if (fr.result !== null && typeof fr.result !== "string") {
          resultBox.innerHTML = "wav読込開始<br />";
          const ndata = loadWav(fr.result);
          resultBox.innerHTML += "wav読込終了<br />";
          resultBox.innerHTML += "world wasm読込初期化<br />";
          console.log("initialize_world");
          const world = new World();
          await world.Initialize();
          resultBox.innerHTML += "world初期化完了<br />";
          const result = worldProcess(world, ndata,resultBox);
          console.log("output");
          if (result) {
            resultBox.innerHTML += "wav書出し中<br />";
            const wp = new WaveProcessing();
            const output_data = wp.InverseLogicalNormalize(
              Array.from(result),
              16
            );
            const output = GenerateWave(44100, 16, output_data, null);
            resultFiles.push(
              new File([output.Output()], f.name, { type: "audio/wav" })
            );
            resultBox.innerHTML += "wav書出し完了<br />";
            console.log("download_ready");
            resultButton.click();
          }
        }
      });
      fr.readAsArrayBuffer(f);
    });
    resultButton.addEventListener("click", (e) => {
      resultBox.innerHTML +=
        '<a href="' +
        URL.createObjectURL(resultFiles[0]) +
        '" download="' +
        resultFiles[0].name +
        '">ダウンロード</a>';
    });
  });
}

main();
