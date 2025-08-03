import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  initializeSocket,
  recieveMessage,
  sendMessage,
} from "../config/socket.js";
import { getWebContainer } from "../config/webContainer.js";
import { UserContext } from "../context/user.context.jsx";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);

      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBoxRef = React.createRef();
  const [fileTree, setFileTree] = useState({});
  const [runProcess, setRunProcess] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [webContainer, setWebContainer] = useState(null);
  function WriteAiMessage(message) {
    const messageObject = JSON.parse(message);

    return (
      <div className="overflow-auto bg-slate-950 text-white rounded-sm p-2">
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }
  function saveFileTree(ft) {
    axios
      .put("/project/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function unflattenFileTree(flatTree) {
    const nestedTree = {};
    for (const [path, value] of Object.entries(flatTree)) {
      const parts = path.split("/");
      let curr = nestedTree;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          curr[part] = value;
        } else {
          curr[part] = curr[part] || {};
          curr = curr[part];
        }
      });
    }
    return nestedTree;
  }

  function normalizedFileTree(tree) {
    return Object.keys(tree).reduce((acc, key) => {
      acc[key.toLowerCase()] = tree[key];
      return acc;
    }, {});
  }

  useEffect(() => {
    initializeSocket(project._id);

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
        console.log("container started");
      });
    }
    recieveMessage("project-message", (data) => {
      if (data.sender._id == "ai") {
        const message = JSON.parse(data.message);
        const normalizedTree = normalizedFileTree(message.fileTree || {});
        console.log(fileTree);
        console.log(message.fileTree);

        webContainer?.mount(message.fileTree);
        if (message.fileTree) {
          setFileTree(normalizedTree);
        }
        setMessages((prevMessages) => [...prevMessages, data]);
      } else {
        setMessages((prevMessages) => [...prevMessages, data]); // Update messages state
      }
    });

    const token = localStorage.getItem("token");

    axios
      .get(`http://localhost:8080/project/get-project/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const normalizedTree = normalizedFileTree(
          res.data.project.fileTree || {}
        );
        setProject(res.data.project), setFileTree(normalizedTree);
      })
      .catch((err) => {
        console.log(err);
      });

    axios
      .get("http://localhost:8080/user/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data.users))
      .catch((err) => {
        console.log(err);
      });
  }, []);

  console.log(fileTree);

  function flattenFileTree(tree, parentPath = "") {
    const result = {};

    for (const [key, value] of Object.entries(tree)) {
      const fullPath = parentPath ? `${parentPath}/${key}` : key;

      if (value.file) {
        result[fullPath] = value;
      } else if (value.dir || value.directory) {
        const subDir = value.dir || value.directory;
        const flattenedSubTree = flattenFileTree(subDir, fullPath);
        Object.assign(result, flattenedSubTree);
      }
    }

    return result;
  }

  const handleUserClick = (id) => {
    console.log(user);
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }

      return newSelectedUserId;
    });
  };

  const addCollaborators = () => {
    console.log(user);
    const token = localStorage.getItem("token");
    axios
      .put(
        "http://localhost:8080/project/add-user",
        {
          projectId: location.state.project._id,
          users: Array.from(selectedUserId),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => setIsModalOpen(false))
      .catch((err) => {
        console.log(err);
      });
  };

  const send = () => {
    sendMessage("project-message", {
      message,
      sender: user,
    });
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]); // Update messages state
    setMessage("");
  };

  function scrollToBottom() {
    messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
  }

  return (
    <main className="h-screen w-screen flex bg-white">
      <section className="relative flex flex-col h-full w-[350px] bg-slate-300">
        {/* Header */}
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100">
          <button className="flex gap-2" onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-fill mr-1"></i>
            <p>Add Collaborator</p>
          </button>
          <button
            className="p-2"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
          >
            <i className="ri-group-fill text-black"></i>
          </button>
        </header>

        {/* Messages + Input */}
        <div className="flex flex-col flex-grow bg-slate-200 overflow-hidden">
          <div
            ref={messageBoxRef}
            className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`w-full flex ${
                  msg.sender._id === user._id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`message flex flex-col p-2 rounded-md
      ${
        msg.sender._id === "ai"
          ? "bg-slate-950 text-white max-w-80"
          : "bg-slate-50 max-w-52"
      }
    `}
                >
                  <small className="opacity-65 text-xs mb-1">
                    {msg.sender.email}
                  </small>
                  <div className="text-sm">
                    {msg.sender._id === "ai" ? (
                      WriteAiMessage(msg.message)
                    ) : (
                      <p>{msg.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full flex bg-white border-t border-slate-300">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 px-4 border border-slate-300 rounded-none flex-grow outline-none"
              placeholder="Enter message"
              type="text"
            />
            <button
              onClick={send}
              className="px-5 bg-slate-950 text-white px-4 rounded-none"
            >
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
      </section>

      <section className="right bg-red-50 flex-grow h-full flex">
        {/* Collaborators Panel */}
        <div className="explorer h-full max-w-64 min-w-52 bg-slate-100">
          <div className="file-tree w-full">
            {Object.keys(fileTree).map((file, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentFile(file);
                  setOpenFiles([...new Set([...openFiles, file])]);
                }}
                className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full"
              >
                <p className="font-semibold text-sm">{file}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="code-editor flex flex-col flex-grow h-full shrink">
          {/* File Tabs Header */}
          <div className="top flex justify-between w-full">
            <div className="files flex gap-1 px-2 py-1 bg-slate-200">
              {openFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFile(file)}
                  className={`open-file 
        px-4 py-2 
        text-sm font-medium 
        rounded-t-md 
        ${
          currentFile === file
            ? "bg-slate-100 text-black shadow-inner"
            : "bg-slate-300 text-slate-700 hover:bg-slate-200"
        }`}
                >
                  {file}
                </button>
              ))}
            </div>

            <div className="actions flex gap-2">
              <button
                onClick={async () => {
                  if (!fileTree || Object.keys(fileTree).length === 0) {
                    console.warn("fileTree is empty or undefined");
                    return;
                  }

                  const nestedFileTree = unflattenFileTree(fileTree);

                  if (!nestedFileTree || typeof nestedFileTree !== "object") {
                    console.error("Invalid nestedFileTree:", nestedFileTree);
                    return;
                  }

                  await webContainer?.mount(nestedFileTree);

                  const flat = flattenFileTree(fileTree);
                  setFileTree(flat);

                  const installProcess = await webContainer?.spawn("npm", [
                    "install",
                  ]);

                  installProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      },
                    })
                  );

                  if (runProcess) {
                    runProcess.kill();
                  }

                  const tempRunProcess = await webContainer.spawn("npm", [
                    "start",
                  ]);

                  tempRunProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                        console.log(chunk);
                      },
                    })
                  );

                  setRunProcess(tempRunProcess);

                  webContainer.on("server-ready", (port, url) => {
                    console.log(port, url);
                    setIframeUrl(url);
                  });
                }}
                className="p-2 px-4 bg-slate-300 text-white"
              >
                run
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
            {fileTree[currentFile] && (
              <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                <pre className="hljs h-full">
                  <code
                    className="hljs h-full outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedContent = e.target.innerText;
                      const ft = {
                        ...fileTree,
                        [currentFile]: {
                          file: {
                            contents: updatedContent,
                          },
                        },
                      };
                      setFileTree(ft);
                      saveFileTree(ft);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: hljs.highlight(
                        "javascript",
                        fileTree[currentFile].file.contents
                      ).value,
                    }}
                    style={{
                      whiteSpace: "pre-wrap",
                      paddingBottom: "25rem",
                      counterSet: "line-numbering",
                    }}
                  />
                </pre>
              </div>
            )}
          </div>
        </div>

        {iframeUrl && webContainer && (
          <div className="flex flex-col h-full min-w-96">
            <div className="address-bar">
              <input
                type="text"
                onChange={(e) => {
                  setIframeUrl(e.target.value);
                }}
                value={iframeUrl}
                className="w-full p-2 px-4 bg-slate-200"
              />
            </div>
            <iframe src={iframeUrl} className="w-full h-full"></iframe>
          </div>
        )}
      </section>
      <div
        className={`fixed top-0 left-0 h-full w-[350px] bg-slate-50 shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${
          isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex justify-between items-center px-3 py-2 bg-slate-200">
          <h1 className="font-semibold text-sm">Collaborators</h1>
          <button
            onClick={() => setIsSidePanelOpen(false)}
            className="p-2 text-black"
          >
            <i className="ri-close-fill"></i>
          </button>
        </header>

        <div className="users flex flex-col gap-1 p-2 overflow-auto">
          {project.users?.map((user) => (
            <div
              key={user.email}
              className="user cursor-pointer hover:bg-slate-300 p-2 flex gap-2"
            >
              <div className="aspect-square rounded-full w-6 flex items-center justify-center bg-slate-600">
                <i className="ri-user-fill text-white text-sm"></i>
              </div>
              <h1 className="font-semibold text-sm">{user.email}</h1>
            </div>
          ))}
        </div>
      </div>

      {/* Add Collaborators Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg p-6 w-96 max-w-full relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Select User</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 hover:text-black text-lg"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* User List */}
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`user cursor-pointer hover:bg-slate-200 ${
                    Array.from(selectedUserId).indexOf(user._id) != -1
                      ? "bg-slate-200"
                      : ""
                  } p-2 flex gap-2 items-center`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <span className="font-medium text-sm">{user.email}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <button
              onClick={addCollaborators}
              className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
