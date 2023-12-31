import { useRef, useState } from 'react';
import './App.css';
import BasePointerTag from './BasePointerTag';
import StackPointerTag from './StackPointerTag';

function App() {

  const [startAddr, setStartAddr] = useState(1000);
  const [stackVals, setStackVals] = useState([]);
  const [args, setArgs] = useState([]); // comma seperated list of arguments to push onto the stack [size, value
  const [ebp, setEbp] = useState(0); // the offset of the ebp pointer from the start address
  const [esp, setEsp] = useState(0); // the offset of the esp pointer from the start address
  const lastBasePointers = useRef([]);

  const valueRef = useRef();
  const sizeRef = useRef();

  function pushStackVal(bytes, val) {
    if (bytes === 0 || !bytes) {return;}

    if (val === "%ebp") {
      lastBasePointers.current.push(ebp);
    }

    let address = startAddr + esp - parseInt(bytes);
    // search through stackVals to see if there is already a value at this address
    let index = stackVals.findIndex((stackVal) => {
      return startAddr + parseInt(stackVal.offset) === address;
    });

    if (index !== -1) {
      // if there is already a value at this address, replace it
      let newStackVals = [...stackVals];
      newStackVals[index] = {
        size: parseInt(bytes),
        value: val,
        offset: esp - bytes,
      };
      setStackVals(newStackVals);
    } else {
      setStackVals([...stackVals, {
        size: parseInt(bytes),
        value: val,
        offset: esp - bytes,
      }])
    }
    setEsp(esp - bytes);
  }

  function popStackVal() {
    if (stackVals.length === 0) { return; }
    if (esp - stackVals[stackVals.length - 1].size > 0) { return; }
    if (stackVals[stackVals.length - 1].value === "%ebp") {
      setEbp(lastBasePointers.current.pop());
    }
    setEsp(esp + stackVals[stackVals.length - 1].size);
    setStackVals(stackVals.slice(0, stackVals.length - 1));
  }

  function addArg(bytes, val) {
    setArgs([...args, {
      size: parseInt(bytes),
      value: val,
    }])
  }

  window.stackVals = stackVals;

  function getStackRows() {
    let components = [...stackVals].reverse().map((val, index) => {
      let address = startAddr + parseInt(val.offset);
      return (
        <tr key={index}>
          <td>
            <div className="d-flex gap-2">
              { startAddr + ebp === address &&
                <BasePointerTag/>
              }
              { startAddr + esp === address &&
                <StackPointerTag/>
              }
            </div>
          </td>
          <th scope="row">0x{address}</th>
          <td>{val.value}</td>
        </tr>
      )
    });
    return components;
  }

  function getArguments() {
    let address = startAddr;
    let components = [...args].reverse().map((arg, index) => {
      address += arg.size;
      return (
        <tr key={index}>
          <td></td>
          <th>0x{address}</th>
          <td>{arg.value}</td>
        </tr>
      )
    });
    return components;
  }

  return (
    <div className="App">
      <div className="header">
        <div className="logoContainer">
          <img src="/Logo.svg" alt="Abstract drawing of a stack of memory"/>
        </div>
        <div className="ms-4">
          <h1>Stack Visualizer</h1>
          <div className="lead ms-1">© David Bootle 2023</div>
        </div>
        <div className="flex-grow-1"></div>
        <a href="https://github.com/TheWeirdSquid/stack-visualizer" aria-label="Github link">
          <div className="githubContainer">
              <img src="/github-mark.svg" alt="github icon"/>
          </div>
        </a>
      </div>
      <div className="customRow">
        <div className="column table-column">

          <div className="card h-100">
              <div className="card-body">

              <table className="table table-striped">
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Addr</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td></td>
                    <th scope="row">--</th>
                    <td>--</td>
                  </tr>
                  {getStackRows()}
                  <tr className="table-row">
                    <td>
                      <div className="d-flex gap-2">
                        { ebp === 0 &&
                          <BasePointerTag/>
                        }
                        { esp === 0 &&
                          <StackPointerTag/>
                        }
                      </div>
                    </td>
                    <th scope="row" className="position-relative">
                      0x{startAddr}
                    </th>
                    <td>*ret_address</td>
                  </tr>
                  {getArguments()}
                </tbody>
              </table>

            </div>
          </div>

        </div>
        <div className="column">

          <div className="card w-100">
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="startAddr" className="form-label">Start Address</label>
                  <div className="input-group">
                    <div className="input-group-text">0x</div>
                    <input type="number" className="form-control" id="startAddr" value={startAddr} onChange={(e) => setStartAddr(parseInt(e.target.value))} />
                  </div>
                </div>
                <hr/>
                <div className="row mb-3">
                  <div className="col-9">
                    <label htmlFor="value" className="form-label">Value</label>
                    <input type="text" className="form-control" id="value" ref={valueRef} />
                  </div>
                  <div className="col-3">
                    <label htmlFor="size" className="form-label">Size</label>
                    <input type="number" className="form-control" id="size" ref={sizeRef} />
                  </div>
                </div>
                <div className="d-flex">
                  <button type="button" className="btn btn-primary me-2" onClick={() => pushStackVal(sizeRef.current.value, valueRef.current.value)}>Push</button>
                  <button type="button" className="btn btn-primary me-2" onClick={() => popStackVal()}>Pop</button>
                  <button type="button" className="btn btn-primary" onClick={() => addArg(sizeRef.current.value, valueRef.current.value)}>Add Argument</button>
                </div>
                <div className="d-flex mt-2">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => {
                    console.log(esp);
                    setEbp(esp);
                  }}>%ebp → %esp</button>
                  <button type="button" className="btn btn-secondary me-2" onClick={() => {
                    console.log(ebp);
                    setEsp(ebp);
                  }}>%esp → %ebp</button>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setEbp(0);
                  }}>Reset Base Pointer</button>
                </div>
              </form>
            </div>
          </div>

          <div className="card w-100 mt-3">
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Caller Should Save</th>
                    <th scope="col">Callee Should Save</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>%eax</td>
                    <td>%ebx</td>
                  </tr>
                  <tr>
                    <td>%ecx</td>
                    <td>%ebp</td>
                  </tr>
                  <tr>
                    <td>%edx</td>
                    <td>%esi</td>
                  </tr>
                  <tr>
                    <td>----</td>
                    <td>%edi</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
