import { ActionPanel, List, showToast, ToastStyle, closeMainWindow, popToRoot } from "@raycast/api";
import { useState } from "react";
import { setTimeout } from "timers/promises";

import util from "util";
import cp from "child_process";

interface State {
  deviceList?: Device[],
}

interface Device { 
  address: string,
  recentAccessDate: string,
  favourrite: boolean,
  name: string,
  connected: boolean,
  paired: boolean,
  RSSI?: number,
  rawRSSI?: number,
  slave?: boolean
}

export default function Main() {
  const [ state, setState ] = useState<State>({});
  const exec = util.promisify(cp.exec);

  async function fetchDevice(){
    const { stdout, stderr } = await exec('blueutil --paired --format JSON');
    const deviceList = JSON.parse(stdout)
    setState({ deviceList: deviceList })
  }
  fetchDevice();


  async function toggleDevice(d: Device){
    const command = d.connected ? 'disconnect' : 'connect'
    showToast( ToastStyle.Animated, `${command}...`)
    try{
      await exec(`blueutil --${command} ${d.address} --wait-${command} ${d.address} 5`);
      fetchDevice();
      showToast( ToastStyle.Success, `Success to ${command} ${d.name}` )
      await setTimeout(500)
      popToRoot({ clearSearchBar: true });
      await closeMainWindow();
    }catch(e){
      showToast( ToastStyle.Failure, `Faild to ${command} ${d.name}` )
      console.error(e)
    }
  }

 
  return (
    <List isLoading={!state.deviceList}>
      {
        state.deviceList?.map((d: Device, i: number) => {
          return (
            <List.Item key={i} title={d.name} accessoryTitle={d.connected ? "connected": ""} 
              actions={
                <ActionPanel>
                  <ActionPanel.Item title="Toggle ON/OFF Device" onAction={() => toggleDevice(d)} />
                </ActionPanel>
              }
            />
          )
        })
      }
    </List>
  );
}

