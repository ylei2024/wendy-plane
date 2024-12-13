import { produce } from "immer";
import { saveAs } from "file-saver";
import { LuaFactory } from "wasmoon";
import React, { useEffect, useState } from "react";

import "./styles/plane.css";
import { HoverTip } from "../components/tips";
import { Deploy, Mod as ModAPI } from "../api";
import { isPublicIP, extractFirstValidIP } from "../common/tools";
import {
  Deploy as DeploySchema,
  PublishedFileDetail,
} from "../common/interface";
import {
  LoadIcon,
  StopIcon,
  CopyIcon,
  LaunchIcon,
  ClickCopyIcon,
} from "../common/svg";

const factory = new LuaFactory("./assets/wasm/glue.wasm");

function getConnection(deploy: DeploySchema) {
  const port = deploy.cluster.ini.master_port;
  const password = deploy.cluster.ini.cluster_password;
  const urlObj = new URL(window.location.href);
  let ip: string = urlObj.hostname;
  if (isPublicIP(deploy.cluster.ini.master_ip)) {
    ip = deploy.cluster.ini.master_ip;
  }
  for (const world of deploy.cluster.world) {
    if (
      world.type === "Master" &&
      world.docker_api != "unix:///var/run/docker.sock"
    ) {
      const docker_ip = extractFirstValidIP(world.docker_api);
      if (docker_ip) {
        ip = docker_ip;
        break;
      }
    }
  }
  return `c_connect("${ip}", ${port}, "${password}")`;
}

export function Plane() {
  const [deploy, setDeploy] = useState<DeploySchema[]>();
  async function loadData() {
    const data = await Deploy.read();
    data.sort((a, b) => {
      if (a.status === b.status) {
        return new Date(b.updated_at) < new Date(a.updated_at) ? 1 : -1;
      } else {
        return a.status !== "running" && b.status === "running" ? 1 : -1;
      }
    });
    setDeploy(data);
  }
  async function handleDelete(id: number) {
    await Deploy.delete(id);
    await loadData();
  }
  useEffect(() => {
    loadData();
  }, []);
  return (
    <div className="plane-box">
      {deploy?.map(function (item) {
        return (
          <PlaneDeploy
            key={item.id}
            deploy={item}
            onDelete={handleDelete}
          ></PlaneDeploy>
        );
      })}
    </div>
  );
}

interface PlaneDeployProps {
  deploy: DeploySchema;
  onDelete: (id: number) => void;
}
function PlaneDeploy(props: PlaneDeployProps) {
  const [deploy, setDeploy] = useState<DeploySchema>(props.deploy);
  const stats: Stats = {
    cpu: 18.09,
    memory: 40.23,
    read: "2015-01-08T22:57:31.547920715Z",
    status: deploy.status,
  };
  return (
    <div className="plane-card">
      <div className="plane-card-room">
        <DeployRoom deploy={deploy} setDeploy={setDeploy}></DeployRoom>
        <SystemInfo stats={stats}></SystemInfo>
        <ButtonBox deploy={deploy} onDelete={props.onDelete}></ButtonBox>
      </div>
      <ModBox deploy={deploy}></ModBox>
    </div>
  );
}

interface DeployRoomProps {
  deploy: DeploySchema;
  setDeploy: React.Dispatch<React.SetStateAction<DeploySchema>>;
}
function DeployRoom(props: DeployRoomProps) {
  const { deploy, setDeploy } = props;
  const handleClusterIniMasterPort = (master_port: string) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.master_port = parseInt(master_port);
      })
    );
  };
  const handleClusterIniMasterIp = (master_ip: string) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.master_ip = master_ip;
      })
    );
  };
  const handleClusterIniMaxPlayers = (max_players: string) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.max_players = parseInt(max_players);
      })
    );
  };
  const handleClusterIniClusterPassword = (cluster_password: string) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.cluster_password = cluster_password;
      })
    );
  };
  const handleClusterIniClusterName = (cluster_name: string) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.cluster_name = cluster_name;
      })
    );
  };
  const handleClusterIniClusterDescription = (cluster_description: string) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.cluster_description = cluster_description;
      })
    );
  };
  const handleClusterToken = (cluster_token: string) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.cluster_token = cluster_token;
      })
    );
  };
  const handleClusterIniGameMode = (
    game_mode: "survival" | "endless" | "wilderness"
  ) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.game_mode = game_mode;
      })
    );
  };
  const handleClusterIniPvp = (enable: boolean) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.pvp = enable;
      })
    );
  };
  const handleClusterIniVote = (enable: boolean) => {
    setDeploy(
      produce((draft) => {
        draft.cluster.ini.vote_enabled = enable;
      })
    );
  };
  const [copyPath, setCopyPath] = useState<string>(CopyIcon);
  async function clickCopyButton() {
    await navigator.clipboard.writeText(getConnection(deploy));
    setCopyPath(ClickCopyIcon);
    setTimeout(() => {
      setCopyPath(CopyIcon);
    }, 500);
  }
  return (
    <div>
      <div className="plane-card-line">
        房间:
        <input
          name="cluster_name"
          value={deploy.cluster.ini.cluster_name}
          onChange={(e) => handleClusterIniClusterName(e.target.value)}
        />
      </div>
      <div className="plane-card-line">
        描述:
        <input
          name="cluster_description"
          value={deploy.cluster.ini.cluster_description}
          onChange={(e) => handleClusterIniClusterDescription(e.target.value)}
        />
      </div>
      <div className="plane-card-line">
        密码:
        <input
          name="cluster_password"
          value={deploy.cluster.ini.cluster_password}
          onChange={(e) => handleClusterIniClusterPassword(e.target.value)}
        />
      </div>
      <div className="plane-card-line">
        人数:
        <input
          type="number"
          name="max_players"
          value={deploy.cluster.ini.max_players}
          onChange={(e) => handleClusterIniMaxPlayers(e.target.value)}
        />
      </div>
      <div className="plane-card-line radio-box">
        模式:
        <div
          className="radio-item"
          onClick={() => handleClusterIniGameMode("endless")}
        >
          <input
            type="radio"
            readOnly={true}
            checked={deploy.cluster.ini.game_mode === "endless"}
          />
          <span>无尽</span>
        </div>
        <div
          className="radio-item"
          onClick={() => handleClusterIniGameMode("survival")}
        >
          <input
            type="radio"
            readOnly={true}
            checked={deploy.cluster.ini.game_mode === "survival"}
          />
          <span>生存</span>
        </div>
        <div
          className="radio-item"
          onClick={() => handleClusterIniGameMode("wilderness")}
        >
          <input
            type="radio"
            readOnly={true}
            checked={deploy.cluster.ini.game_mode === "wilderness"}
          />
          <span>荒野</span>
        </div>
      </div>
      <div className="plane-card-line radio-box">
        PVP:
        <div className="radio-item" onClick={() => handleClusterIniPvp(false)}>
          <input
            type="radio"
            readOnly={true}
            checked={!deploy.cluster.ini.pvp}
          />
          <span>关闭</span>
        </div>
        <div className="radio-item" onClick={() => handleClusterIniPvp(true)}>
          <input
            type="radio"
            readOnly={true}
            checked={deploy.cluster.ini.pvp}
          />
          <span>开启</span>
        </div>
      </div>
      <div className="plane-card-line radio-box">
        投票:
        <div className="radio-item" onClick={() => handleClusterIniVote(false)}>
          <input
            type="radio"
            readOnly={true}
            checked={!deploy.cluster.ini.vote_enabled}
          />
          <span>关闭</span>
        </div>
        <div className="radio-item" onClick={() => handleClusterIniVote(true)}>
          <input
            type="radio"
            readOnly={true}
            checked={deploy.cluster.ini.vote_enabled}
          />
          <span>开启</span>
        </div>
      </div>
      <div className="plane-card-line">
        主机:
        <input
          name="master_ip"
          value={deploy.cluster.ini.master_ip}
          onChange={(e) => handleClusterIniMasterIp(e.target.value)}
        />
      </div>
      <div className="plane-card-line">
        端口:
        <input
          name="master_port"
          value={deploy.cluster.ini.master_port}
          onChange={(e) => handleClusterIniMasterPort(e.target.value)}
        />
      </div>
      <div className="plane-card-line">
        令牌:
        <input
          name="cluster_token"
          value={deploy.cluster.cluster_token}
          onChange={(e) => handleClusterToken(e.target.value)}
        />
      </div>
      <div className="plane-card-line copy-box">
        直连:
        <input value={getConnection(deploy)} readOnly={true} />
        <div>
          <button
            onClick={clickCopyButton}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="复制"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#3498db">
              <path d={copyPath}></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface Stats {
  cpu: number;
  memory: number;
  read: string;
  status: "running" | "pending" | "stop";
}
interface SystemInfoProps {
  stats: Stats;
}
function SystemInfo(props: SystemInfoProps) {
  const { stats } = props;
  return (
    <div className="stats-box">
      <div className="stats-box-item">
        <HoverTip tip="CPU">
          <svg viewBox="0 0 1024 1024" width="24" height="24" fill="#3498db">
            <path d="M906.26 398 906.26 337.2l-72.1 0.2 0-94.3c0-23.9-12.3-37.3-36.2-37.3l-86.9 0 0-73.8-61.5 0 0 73.8-92.4 0L557.16 132l-61.5 0-0.1 73.8L403.16 205.8l0.2-73.8-61.8 0 0.1 73.8-80.9 0c-29.7 0-41.9 13.4-41.7 44.4l-0.6 87.2-73.4 0L145.06 398l73.4 0 0 84.9-73.4-0.1 0 61.5 73.4 0.2 0 86.2-73.4 0 0 60.4 73.4 0 0 82.4c0 34 13.7 48.1 47.8 48.1l75.4 0-0.1 70.8 61.4 0 0.3-70.8 92.4 0 0 70.8 61.7 0-0.1-70.8 92.4 0-0.2 70.8 61.7 0 0.1-70.8 82.3 0c27.6 0 40.8-24.3 40.8-48.1l0-82.4 72.1 0 0-60.4L834.16 630.7l0-86.2 72.1 0 0-61.4-72.1-0.2L834.16 398 906.26 398zM772.56 760 280.06 760 280.06 267.4l492.6 0L772.66 760zM382.96 682.3l295.8 0c11.8 0 16.1-8.1 16.1-18.8L694.86 367c0-12.6-8.6-19.6-18.8-19.6L379.86 347.4c-15.4 0-19.9 5.7-19.9 21.2l0 290.6C359.96 674.6 367.56 682.3 382.96 682.3z"></path>
          </svg>
        </HoverTip>
        <div className="stats-box-text">{stats.cpu}%</div>
      </div>
      <div className="stats-box-item">
        <HoverTip tip="内存">
          <svg viewBox="0 0 1024 1024" width="24" height="24" fill="#3498db">
            <path d="M922.688 810.624h-149.312a37.376 37.376 0 0 1-37.312-37.376L736 736h-49.792v74.688H611.584V736h-49.792v74.688H462.208V736h-49.728v74.688H337.792V736H288l-0.256 37.248a37.312 37.312 0 0 1-37.312 37.376h-149.12A37.312 37.312 0 0 1 64 773.248V250.752c0-20.672 16.704-37.376 37.312-37.376h821.312a37.312 37.312 0 0 1 37.376 37.376v522.496a37.312 37.312 0 0 1-37.312 37.376z m-37.376-177.344h-39.168a37.376 37.376 0 0 1 0-74.752h39.168V288.128H138.688v270.4h37.952a37.376 37.376 0 0 1 0 74.752h-37.952v102.528H213.12l0.256-49.6c0-20.672 4.288-24.896 24.896-24.896h547.584c20.608 0 24.896 4.224 24.896 24.896v49.6h74.624V633.28zM736 337.792h74.688V512H736V337.792z m-174.208 0h74.688V512H561.792V337.792z m-174.208 0h74.688V512H387.584V337.792z m-174.272 0H288V512l-73.472-0.128-1.216-174.08z"></path>
          </svg>
        </HoverTip>
        <div className="stats-box-text">{stats.memory}%</div>
      </div>
      <div className="stats-box-item">
        <div className="stats-box-text">
          {stats.status == "running" ? "运行中" : "已停止"}
        </div>
        <svg
          viewBox="0 0 1024 1024"
          width="18"
          height="18"
          fill={stats.status == "running" ? "#00ff00" : "#ff0000"}
        >
          <path d="M514.048 128q79.872 0 149.504 30.208t121.856 82.432 82.432 122.368 30.208 150.016q0 78.848-30.208 148.48t-82.432 121.856-121.856 82.432-149.504 30.208-149.504-30.208-121.856-82.432-82.432-121.856-30.208-148.48q0-79.872 30.208-150.016t82.432-122.368 121.856-82.432 149.504-30.208z"></path>
        </svg>
      </div>
    </div>
  );
}

interface ButtonProps {
  tip: string;
  children: React.ReactNode;
  load: boolean;
  load_tip: string;
  onClick?: React.MouseEventHandler<HTMLDivElement> | undefined;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement> | undefined;
}
function Button(props: ButtonProps) {
  const { tip, children, load, load_tip, onClick, onMouseLeave } = props;
  return (
    <div
      className="buttons-box-item"
      onClick={onClick}
      onMouseLeave={onMouseLeave}
    >
      {load ? (
        <HoverTip tip={load_tip}>
          <svg fill="#3498db" viewBox="0 0 1024 1024" width="27" height="27">
            <path d={LoadIcon}>
              <animateTransform
                attributeType="xml"
                attributeName="transform"
                type="rotate"
                from="0 512 512"
                to="360 512 512"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </HoverTip>
      ) : (
        <HoverTip tip={tip}>
          <svg fill="#3498db" viewBox="0 0 1024 1024" width="27" height="27">
            {children}
          </svg>
        </HoverTip>
      )}
    </div>
  );
}

interface ButtonBoxStates {
  deleting: boolean;
  downloading: boolean;
  deploying: boolean;
  executing: boolean;
}
interface ButtonBoxProps {
  deploy: DeploySchema;
  onDelete: (id: number) => void;
}
function ButtonBox(props: ButtonBoxProps) {
  const { deploy, onDelete } = props;
  const [shareTip, setShareTip] = useState("分享");
  const [states, setStates] = useState<ButtonBoxStates>({
    deleting: false,
    downloading: false,
    deploying: false,
    executing: false,
  });
  async function handleShare() {
    let text = "";
    text = text + `房间: ${deploy.cluster.ini.cluster_name}\n`;
    text = text + `玩家: ${deploy.cluster.ini.max_players}\n`;
    text = text + `密码: ${deploy.cluster.ini.cluster_password}\n`;
    text = text + `描述: ${deploy.cluster.ini.cluster_description}\n`;
    text = text + `直连: ${getConnection(deploy)}\n`;
    await navigator.clipboard.writeText(text);
    setShareTip("成功复制");
  }
  async function clickDelete() {
    setStates({
      ...states,
      deleting: true,
    });
    onDelete(deploy.id);
  }
  async function clickDownload() {
    setStates({
      ...states,
      downloading: true,
    });
    try {
      const response = await fetch(`api/cluster/download/${deploy.id}`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("File download failed");
      }
      const blob = await response.blob();
      const filename =
        response.headers.get("Content-Disposition")?.split("filename=")[1] ||
        "downloaded-file";
      saveAs(blob, filename);
    } catch (error) {
      console.error("Download error:", error);
    }
    setStates({
      ...states,
      downloading: false,
    });
  }
  async function clickSave() {
    setStates({
      ...states,
      deploying: true,
    });
    await Deploy.update(deploy.id, deploy);
    setStates({
      ...states,
      deploying: false,
    });
  }
  return (
    <div className="buttons-box">
      <Button
        tip={shareTip}
        load={false}
        load_tip={shareTip}
        onClick={handleShare}
        onMouseLeave={() => {
          setShareTip("分享");
        }}
      >
        <path d="M1016.1904 93.352c-7.7152-8.776-19.96-12.7344-31.7152-9.552L23.1664 343.5216c-11.3072 3.0608-19.8992 12.0816-22.4288 23.5104-2.5104 11.4288 1.4896 23.2256 10.4704 30.776L239.008 589.1184l104.5536 290.456c4.1232 11.3872 14.552 19.4704 26.4704 20.5712l3.1232 0.1632c10.96 0 21.2448-5.8784 26.8576-15.3472l63.0016-106.2064 181.2496 154.984c5.632 4.8576 12.8976 7.552 20.368 7.552 2.6944 0 5.1424-0.2864 7.3056-0.8576 9.7152-2.3264 17.8368-9.224 21.7152-18.5312l327.968-795.856C1026.192 115.1072 1024.0688 102.2496 1016.1904 93.352zM617.0784 426.992l-119.6976 158.7792c-5.0608 6.6944-7.2048 14.9392-6.0416 23.2256 1.1632 8.2864 5.4896 15.6336 12.2048 20.736 13.3264 10 33.8176 7.1024 43.8784-6.2048L745.8992 360.256c8.7344-11.6736 8.368-27.6336-0.8576-38.736-9.0608-11.0208-25.3072-14.5312-37.96-8.2864l-439.44 214.6576c-0.8368 0.408-1.632 0.8576-2.4288 1.3472L97.4736 388.3792l841.9792-227.4336L652.1408 858.024l-176.6976-151.1472c-5.6736-4.816-12.9184-7.5104-20.3888-7.5104-1.6128 0-3.2448 0.1632-5.1424 0.4496-9.1424 1.5104-17.1024 6.9792-21.7968 14.8976l-48.0832 81.0224-77.4304-215.1488L617.0784 426.992z"></path>
      </Button>
      <Button
        tip="下载"
        load={states.downloading}
        load_tip="下载中"
        onClick={clickDownload}
      >
        <path
          d="M808.192 246.528a320.16 320.16 0 0 0-592.352 0A238.592 238.592 0 0 0 32 479.936c0 132.352 107.648 240 240 240h91.488a32 32 0 1 0 0-64H272a176.192 176.192 0 0 1-176-176 175.04 175.04 0 0 1 148.48-173.888l19.04-2.976 6.24-18.24C305.248 181.408 402.592 111.936 512 111.936a256 256 0 0 1 242.208 172.896l6.272 18.24 19.04 2.976A175.04 175.04 0 0 1 928 479.936c0 97.024-78.976 176-176 176h-97.28a32 32 0 1 0 0 64h97.28c132.352 0 240-107.648 240-240a238.592 238.592 0 0 0-183.808-233.408z"
          p-id="2434"
        ></path>
        <path d="M649.792 789.888L544 876.48V447.936a32 32 0 0 0-64 0V876.48l-106.752-87.424a31.968 31.968 0 1 0-40.544 49.504l159.04 130.24a32 32 0 0 0 40.576 0l158.048-129.44a32 32 0 1 0-40.576-49.472z"></path>
      </Button>
      <Button
        tip="删除"
        load={states.deleting}
        load_tip="删除中"
        onClick={clickDelete}
      >
        <path d="M607.897867 768.043004c-17.717453 0-31.994625-14.277171-31.994625-31.994625L575.903242 383.935495c0-17.717453 14.277171-31.994625 31.994625-31.994625s31.994625 14.277171 31.994625 31.994625l0 351.94087C639.892491 753.593818 625.61532 768.043004 607.897867 768.043004z"></path>
        <path d="M415.930119 768.043004c-17.717453 0-31.994625-14.277171-31.994625-31.994625L383.935495 383.935495c0-17.717453 14.277171-31.994625 31.994625-31.994625 17.717453 0 31.994625 14.277171 31.994625 31.994625l0 351.94087C447.924744 753.593818 433.647573 768.043004 415.930119 768.043004z"></path>
        <path d="M928.016126 223.962372l-159.973123 0L768.043004 159.973123c0-52.980346-42.659499-95.983874-95.295817-95.983874L351.94087 63.989249c-52.980346 0-95.983874 43.003528-95.983874 95.983874l0 63.989249-159.973123 0c-17.717453 0-31.994625 14.277171-31.994625 31.994625s14.277171 31.994625 31.994625 31.994625l832.032253 0c17.717453 0 31.994625-14.277171 31.994625-31.994625S945.73358 223.962372 928.016126 223.962372zM319.946246 159.973123c0-17.545439 14.449185-31.994625 31.994625-31.994625l320.806316 0c17.545439 0 31.306568 14.105157 31.306568 31.994625l0 63.989249L319.946246 223.962372 319.946246 159.973123 319.946246 159.973123z"></path>
        <path d="M736.048379 960.010751 288.123635 960.010751c-52.980346 0-95.983874-43.003528-95.983874-95.983874L192.139761 383.591466c0-17.717453 14.277171-31.994625 31.994625-31.994625s31.994625 14.277171 31.994625 31.994625l0 480.435411c0 17.717453 14.449185 31.994625 31.994625 31.994625l448.096758 0c17.717453 0 31.994625-14.277171 31.994625-31.994625L768.215018 384.795565c0-17.717453 14.277171-31.994625 31.994625-31.994625s31.994625 14.277171 31.994625 31.994625l0 479.231312C832.032253 916.835209 789.028725 960.010751 736.048379 960.010751z"></path>
      </Button>
      <Button
        tip="保存部署"
        load={states.deploying}
        load_tip="部署中"
        onClick={clickSave}
      >
        <path d="M965.1712 223.03232c-6.1184-47.68256-24.01792-86.77376-53.22752-115.98336-29.19936-29.20448-68.19328-47.09376-115.968-53.21728-43.66848-5.64736-92.672-0.9472-145.53088 13.77792-107.14112 29.91104-217.34912 97.49504-310.25664 190.27456a907.82208 907.82208 0 0 0-28.2624 29.55264c-87.01952-0.70144-166.02624 30.14144-223.47776 87.71584A292.5056 292.5056 0 0 0 28.50304 462.0544a29.4912 29.4912 0 0 0 26.84928 41.55392 30.68416 30.68416 0 0 0 10.71616-2.00192c38.02624-14.96064 82.41152-18.24768 129.63328-9.89184-10.83392 57.09824-1.536 112.2048 27.904 165.888a29.44512 29.44512 0 1 0 51.5328-28.25216c-23.31648-42.50624-42.86976-103.60832 0.93696-191.57504 0.128-0.2304 0.24064-0.34816 0.3584-0.5888 0.34304-0.768 0.73728-1.52064 1.1776-2.24256l1.7664-3.52256 2.10432-3.8912c0.11264-0.11264 0.11264-0.2304 0.2304-0.47104 15.77472-28.96384 37.56544-59.21792 65.00864-90.44992l0.11264-0.11264a782.848 782.848 0 0 1 34.84672-36.98176c62.52544-62.52032 135.40864-113.5872 207.9488-146.944l276.59264 276.59776c-33.32096 72.56576-84.41856 145.39776-146.92864 207.92832-57.70752 57.7024-112.45056 96.66048-163.2 116.33152-0.10752 0.11776-0.35328 0.11776-0.47104 0.23552-1.65888 0.58368-3.30752 1.29536-4.9408 1.8944l-1.05984 0.33792c-1.77152 0.5888-3.42016 1.1776-5.18656 1.77152-0.47616 0.10752-0.93696 0.34304-1.40288 0.48128a221.16864 221.16864 0 0 1-21.66272 5.87776c-50.74432 11.06944-98.31424 1.77152-145.13664-28.49792a29.50144 29.50144 0 0 0-31.91808 49.6128c43.8016 28.26752 89.60512 42.38336 136.832 42.38336a246.36416 246.36416 0 0 0 46.03904-4.52096c8.4224 47.32416 5.0688 91.71968-9.76896 129.74592a29.45024 29.45024 0 0 0 39.43936 37.56032 292.224 292.224 0 0 0 86.90176-59.94496c57.57952-57.56928 88.42752-136.46336 87.72096-223.47264a1059.86048 1059.86048 0 0 0 29.54752-28.25728c92.90752-92.90752 160.49152-202.9824 190.27456-310.25664 14.80704-52.68992 19.4048-101.54496 13.87008-145.34656zM212.90496 435.08736a344.77056 344.77056 0 0 0-66.64704-6.7072 275.36384 275.36384 0 0 0-28.02176 1.30048 203.3408 203.3408 0 0 1 11.89888-12.83072c34.85184-34.85184 79.92832-57.58464 130.57536-66.41664-20.64896 28.84096-36.42368 56.86784-47.80544 84.65408z m389.25312 453.77024a201.40032 201.40032 0 0 1-12.83072 11.89888c2.82112-30.2592 0.94208-62.17216-5.41696-94.90944 27.78624-11.29984 55.936-27.19744 84.64896-47.67744-8.69376 50.74944-31.43168 95.8464-66.40128 130.688z m292.60288-536.07424c-1.536 5.5296-3.17952 11.06944-4.94592 16.60416L649.728 129.30048a496.96256 496.96256 0 0 1 16.59904-4.9408c89.25696-24.84224 163.6608-16.00512 204.04224 24.38144 40.38144 40.38144 49.35168 114.76992 24.39168 204.04224z"></path>
        <path d="M418.36544 607.40096a29.45024 29.45024 0 0 0-41.6768 0l-188.74368 188.73856a29.4912 29.4912 0 0 0-0.00512 41.69216 29.48608 29.48608 0 0 0 41.68704 0l188.73856-188.73856a29.65504 29.65504 0 0 0 0-41.69216z"></path>
      </Button>
      <Button
        tip={deploy.status == "running" ? "停止" : "启动"}
        load={states.executing}
        load_tip={deploy.status == "running" ? "启动中" : "启动中"}
        onClick={() => {}}
      >
        <path d={deploy.status == "running" ? StopIcon : LaunchIcon}></path>
      </Button>
    </div>
  );
}

interface ModBoxContent {
  pick: PublishedFileDetail[];
  search: PublishedFileDetail[];
  state?: "searching" | "parsing" | undefined;
}
interface ModProps {
  mode?: "add";
  content: ModBoxContent;
  mod: PublishedFileDetail;
  setContent: React.Dispatch<React.SetStateAction<ModBoxContent>>;
}
function Mod(props: ModProps) {
  const { mode, content, mod, setContent } = props;
  const [adding, setAdding] = useState<boolean>(false);
  const onDelete = async () => {
    const pick = content.pick.filter(
      (e) => e.publishedfileid !== mod.publishedfileid
    );
    setContent(
      produce((draft) => {
        draft.pick = pick;
      })
    );
  };
  const onAdd = async () => {
    const search = content.search.filter(
      (e) => e.publishedfileid !== mod.publishedfileid
    );
    const pick = content.pick.filter(
      (e) => e.publishedfileid !== mod.publishedfileid
    );
    setAdding(true);
    const config = await ModAPI.readConfig([mod.publishedfileid]);
    if (config.length > 0) {
      const mod_config = config[0];
      const lua = await factory.createEngine();
      await lua.doString(mod_config.code);
      pick.push({
        ...mod,
        code: mod.code,
        configuration_options: lua.global.get("configuration_options"),
      });
      setContent(
        produce((draft) => {
          draft.pick = pick;
          draft.search = search;
        })
      );
    }
    setAdding(false);
  };
  return (
    <div className="mod-item">
      <img src={mod.preview_url} width="2.8rem" height="2.8rem" />
      <div className="mod-item-left">
        <div className="mod-item-title">{mod.title}</div>
        {mode === "add" ? (
          <div className="mod-item-button">
            <div onClick={onAdd}>
              {!adding ? (
                <HoverTip tip="点击添加">
                  <svg
                    viewBox="0 0 1024 1024"
                    width="18"
                    height="18"
                    fill="#3498db"
                    transform="scale(1.2)"
                  >
                    <path d="M521.813333 85.333333c-235.52 0-426.666667 191.146667-426.666666 426.666667s191.146667 426.666667 426.666666 426.666667 426.666667-191.146667 426.666667-426.666667-190.72-426.666667-426.666667-426.666667z m0 785.066667c-197.546667 0-358.4-160.853333-358.4-358.4s160.853333-358.4 358.4-358.4 358.4 160.853333 358.4 358.4-160.426667 358.4-358.4 358.4z"></path>
                    <path
                      d="M675.413333 546.133333h-307.2c-18.773333 0-34.133333-15.36-34.133333-34.133333s15.36-34.133333 34.133333-34.133333h307.2c18.773333 0 34.133333 15.36 34.133334 34.133333s-14.933333 34.133333-34.133334 34.133333z"
                      fill="#4C4C4C"
                      p-id="13993"
                    ></path>
                    <path d="M487.68 665.6V358.4c0-18.773333 15.36-34.133333 34.133333-34.133333s34.133333 15.36 34.133334 34.133333v307.2c0 18.773333-15.36 34.133333-34.133334 34.133333s-34.133333-15.36-34.133333-34.133333z"></path>
                  </svg>{" "}
                </HoverTip>
              ) : (
                <HoverTip tip="正在添加模组">
                  <svg
                    fill="#3498db"
                    viewBox="0 0 1024 1024"
                    width="18"
                    height="18"
                  >
                    <path d={LoadIcon}>
                      <animateTransform
                        attributeType="xml"
                        attributeName="transform"
                        type="rotate"
                        from="0 512 512"
                        to="360 512 512"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                </HoverTip>
              )}
            </div>
          </div>
        ) : (
          <div className="mod-item-button">
            <div>
              <HoverTip tip="配置模组">
                <svg
                  viewBox="0 0 1024 1024"
                  width="18"
                  height="18"
                  fill="#3498db"
                >
                  <path d="M872.554667 306.304c-22.613333 8.128-45.696 9.941333-69.162667 4.373333a119.722667 119.722667 0 0 1-85.504-158.144c1.749333-4.842667 0.853333-6.954667-3.605333-8.96-17.92-8.106667-35.541333-16.917333-53.674667-24.533333-11.925333-4.992-24.533333-8.384-36.501333-12.373333-23.146667 47.658667-59.456 74.88-112.064 74.88-52.821333 0-89.258667-27.306667-111.978667-74.538667a411.733333 411.733333 0 0 0-95.530667 39.573333c17.216 49.493333 10.922667 94.634667-26.538666 131.925334-37.376 37.205333-82.496 43.712-131.776 26.282666A413.290667 413.290667 0 0 0 106.666667 400.298667c46.933333 22.656 74.197333 58.666667 74.517333 110.997333 0.32 53.162667-26.986667 89.770667-74.538667 112.768a410.154667 410.154667 0 0 0 39.637334 95.530667c47.808-16.789333 91.669333-11.370667 128.64 23.253333 39.957333 37.44 47.274667 83.626667 29.653333 134.933333a404.949333 404.949333 0 0 0 95.530667 39.466667c23.04-47.36 59.349333-74.474667 111.978666-74.453333 52.885333 0.064 89.216 27.541333 111.893334 74.538666a411.584 411.584 0 0 0 95.488-39.616c-17.386667-49.493333-10.816-94.4 26.24-131.626666 37.290667-37.418667 82.432-43.776 132.053333-26.538667a407.637333 407.637333 0 0 0 39.509333-95.509333c-47.786667-23.210667-74.986667-59.946667-74.517333-113.066667 0.448-52.053333 27.562667-87.957333 74.56-110.656a420.394667 420.394667 0 0 0-38.016-92.970667c-2.048-3.712-4.309333-1.92-6.762667-1.066666z m85.952 82.794667a42.666667 42.666667 0 0 1-22.613334 49.642666c-34.602667 16.725333-50.176 39.146667-50.453333 72.618667-0.298667 34.282667 15.253333 57.194667 50.496 74.304a42.666667 42.666667 0 0 1 22.549333 49.536 450.304 450.304 0 0 1-43.669333 105.472 42.666667 42.666667 0 0 1-51.050667 19.178667c-36.650667-12.736-63.850667-7.68-87.808 16.362666-23.914667 24.021333-28.949333 51.093333-16.213333 87.381334a42.666667 42.666667 0 0 1-19.072 51.178666 454.229333 454.229333 0 0 1-105.344 43.690667 42.666667 42.666667 0 0 1-49.770667-22.592c-16.725333-34.688-39.509333-50.368-73.493333-50.389333-33.92-0.021333-56.597333 15.509333-73.578667 50.432a42.666667 42.666667 0 0 1-49.322666 22.570666 447.338667 447.338667 0 0 1-105.6-43.562666 42.666667 42.666667 0 0 1-19.328-50.986667c13.034667-37.973333 7.381333-65.728-18.474667-89.941333-23.594667-22.101333-50.090667-26.517333-85.333333-14.144a42.666667 42.666667 0 0 1-51.157334-19.050667 452.821333 452.821333 0 0 1-43.733333-105.450667 42.666667 42.666667 0 0 1 22.549333-49.706666c35.072-16.938667 50.666667-39.808 50.453334-74.069334-0.213333-33.642667-15.786667-56.149333-50.389334-72.853333A42.666667 42.666667 0 0 1 65.493333 389.12a455.808 455.808 0 0 1 43.541334-105.344 42.666667 42.666667 0 0 1 51.392-19.242667c36.096 12.778667 63.317333 7.722667 87.466666-16.298666 24-23.893333 29.034667-51.072 16.32-87.68a42.666667 42.666667 0 0 1 19.178667-51.050667 454.4 454.4 0 0 1 105.386667-43.669333 42.666667 42.666667 0 0 1 49.706666 22.656c16.725333 34.730667 39.509333 50.389333 73.536 50.368 33.898667 0 56.576-15.616 73.664-50.837334a42.666667 42.666667 0 0 1 51.882667-21.845333c2.517333 0.832 4.992 1.621333 9.28 2.965333l7.530667 2.346667c8.96 2.88 15.786667 5.290667 22.698666 8.192 10.154667 4.245333 18.090667 7.872 35.029334 15.829333 10.069333 4.736 14.4 6.741333 19.733333 9.152 25.024 11.306667 35.349333 36.821333 26.154667 62.336-16 44.352 9.344 91.221333 55.253333 102.144 14.805333 3.52 29.418667 2.538667 44.864-3.029333a33.28 33.28 0 0 1 4.48-1.621333c5.269333-1.621333 10.88-2.453333 17.322667-1.941334 16.853333 1.344 29.525333 11.093333 36.736 24.170667a462.890667 462.890667 0 0 1 41.813333 102.357333zM522.666667 320a202.666667 202.666667 0 1 0 166.4 86.954667 21.333333 21.333333 0 0 0-35.008 24.384 160 160 0 1 1-69.184-56.128 21.333333 21.333333 0 0 0 16.597333-39.317334A202.090667 202.090667 0 0 0 522.666667 320z"></path>
                </svg>
              </HoverTip>
            </div>
            <div onClick={onDelete}>
              <HoverTip tip="删除">
                <svg
                  viewBox="0 0 1024 1024"
                  width="18"
                  height="18"
                  fill="#3498db"
                  transform="scale(1.35)"
                >
                  <path d="M512 146.286a365.714 365.714 0 1 1 0 731.428 365.714 365.714 0 0 1 0-731.428z m0 62.025a303.69 303.69 0 1 0 0.073 607.451A303.69 303.69 0 0 0 512 208.311zM647.022 376.32a6.555 6.555 0 0 1 6.583 6.583 6.583 6.583 0 0 1-1.463 4.169L545.865 513.609l106.057 126.537a6.802 6.802 0 0 1 1.536 4.17 6.555 6.555 0 0 1-6.583 6.582l-53.833-0.292L512 553.984l-81.042 96.695-53.98 0.292a6.583 6.583 0 0 1-4.973-10.825l106.203-126.464-106.203-126.537a6.802 6.802 0 0 1-1.536-4.242 6.477 6.477 0 0 1 6.51-6.51l53.979 0.293L512 473.234l81.189-96.768z"></path>
                </svg>
              </HoverTip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchModProps {
  content: ModBoxContent;
  setContent: React.Dispatch<React.SetStateAction<ModBoxContent>>;
}
function SearchMod(props: SearchModProps) {
  const { content, setContent } = props;
  const [key, setKey] = useState<string>("");
  const mods: string[] = [];
  content.pick.forEach((e) => mods.push(e.publishedfileid));
  async function handleSearch() {
    if (key === "") {
      setContent(
        produce((draft) => {
          draft.search = [];
        })
      );
    } else {
      setContent(
        produce((draft) => {
          draft.state = "searching";
        })
      );
      const search = await ModAPI.search(key);
      setContent(
        produce((draft) => {
          draft.state = undefined;
          draft.search = search.filter(
            (item) => !mods.includes(item.publishedfileid)
          );
        })
      );
    }
  }
  return (
    <>
      <div className="search-mod">
        <input
          placeholder="搜索模组"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        ></input>
        <div onClick={handleSearch}>
          <svg viewBox="0 0 1024 1024" width="24" height="24" fill="#3498db">
            <path d="M480 128a352 352 0 0 1 270.528 577.28l138.24 138.24c10.752 10.496 9.28 29.312-3.2 42.112-12.8 12.48-31.616 13.888-42.048 3.136l-138.24-138.24A352 352 0 1 1 480 128z m0 63.36c-182.72 0-288.128 147.2-288.128 288.64s105.088 289.28 288 289.28c182.848 0 288-147.84 288-289.28 0-141.44-105.152-288.64-287.872-288.64z"></path>
          </svg>
        </div>
      </div>
      {content.state === "searching" && (
        <div className="mod-box-loading">
          <HoverTip tip="搜索中">
            <svg fill="#3498db" viewBox="0 0 1024 1024" width="32" height="32">
              <path d={LoadIcon}>
                <animateTransform
                  attributeType="xml"
                  attributeName="transform"
                  type="rotate"
                  from="0 512 512"
                  to="360 512 512"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </HoverTip>
        </div>
      )}
      {content.search.length > 0 && content.state !== "searching" && (
        <div className="mod-box-search">
          {content.search?.map(function (item, index) {
            return (
              <Mod
                key={index}
                mode="add"
                mod={item}
                content={content}
                setContent={setContent}
              ></Mod>
            );
          })}
        </div>
      )}
    </>
  );
}

interface ModBoxProps {
  deploy: DeploySchema;
}
function ModBox(props: ModBoxProps) {
  const { deploy } = props;
  const [content, setContent] = useState<ModBoxContent>({
    pick: [],
    search: [],
  });
  async function loadData() {
    const mods: string[] = [];
    if (deploy.cluster.world) {
      const regex = /workshop-([0-9]+)/g;
      let match;
      while (
        (match = regex.exec(deploy.cluster.world[0].modoverrides)) !== null
      ) {
        mods.push(match[1]);
      }
    }
    if (mods.length > 0) {
      setContent(
        produce((draft) => {
          draft.state = "parsing";
        })
      );
      const lua = await factory.createEngine();
      const pick = await ModAPI.read(mods);
      const pick_config = await ModAPI.readConfig(mods);
      try {
        for (const item of pick) {
          const config = pick_config.find((e) => e.id == item.publishedfileid);
          if (config) {
            item.code = config.code;
            await lua.doString(config.code);
            item.configuration_options = lua.global.get(
              "configuration_options"
            );
          }
        }
      } finally {
        lua.global.close();
      }
      setContent(
        produce((draft) => {
          draft.state = undefined;
          draft.pick = pick;
        })
      );
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, []);
  return (
    <div className="mod-box">
      <SearchMod content={content} setContent={setContent}></SearchMod>
      <div className="mod-box-separation-line"></div>
      <div
        className="mod-box-added"
        style={{
          height:
            content.search.length <= 0 && content.state !== "searching"
              ? "78%"
              : "45%",
        }}
      >
        {content.state === "parsing" ? (
          <div className="mod-box-loading">
            <HoverTip tip="正在解析模组列表">
              <svg
                fill="#3498db"
                viewBox="0 0 1024 1024"
                width="32"
                height="32"
              >
                <path d={LoadIcon}>
                  <animateTransform
                    attributeType="xml"
                    attributeName="transform"
                    type="rotate"
                    from="0 512 512"
                    to="360 512 512"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </HoverTip>
          </div>
        ) : (
          content.pick?.map(function (item, index) {
            return (
              <Mod
                key={index}
                mod={item}
                content={content}
                setContent={setContent}
              ></Mod>
            );
          })
        )}
      </div>
    </div>
  );
}
