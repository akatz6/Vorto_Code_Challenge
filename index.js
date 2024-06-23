// Time constraint
const TIME = 12 * 60;

// Find minutes between two points
const findMinutes = (end, begin) => {
  return Math.sqrt(
    Math.pow(end[0] - begin[0], 2) + Math.pow(end[1] - begin[1], 2)
  );
};

// Created base object with id, starting and ending point
const setObject = (line) => {
  const begin = line[1].split(",");
  const end = line[2].split(",");
  return {
    id: line[0],
    starting: [
      begin[0].substring(1),
      begin[1].substring(0, begin[1].length - 1),
    ],
    ending: [end[0].substring(1), end[1].substring(0, end[1].length - 1)],
  };
};

// Sets minutes from point 0,0 to start, from start to end, and from end back to 0,0
const getMinutes = (obj) => {
  obj.minutesFromStarting = findMinutes(obj.starting, [0, 0]);
  obj.minutesWithCargo = findMinutes(obj.ending, obj.starting);
  obj.minutesFromBase = findMinutes([0, 0], obj.ending);
};

// Creates an array of objects for each node
const createArrayOfObjects = (data) => {
  const arr = data.split("\n");
  const returnArr = [];
  for (let i = 1; i < arr.length; i++) {
    const line = arr[i].split(" ");
    if (line[1]) {
      obj = setObject(line);
      getMinutes(obj);
      returnArr.push(obj);
    }
  }
  return returnArr;
};

// Calculates distance between each node and all other nodes
const setEdges = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    const startNode = arr[i];
    const arrOfMinutes = [];
    for (let j = 0; j < arr.length; j++) {
      const endingNode = arr[j];
      if (startNode.id !== endingNode.id) {
        const key = `minutesFrom${startNode.id}to${endingNode.id}`;
        arrOfMinutes.push([
          key,
          findMinutes(startNode.ending, endingNode.starting),
        ]);
      }
    }
    startNode.arrOfMinutes = arrOfMinutes;
  }
};

// Creates an object based on id for each node for quicker look up time
const setNodesIntoObj = (arr) => {
  const obj = {};
  for (let i = 0; i < arr.length; i++) {
    obj[arr[i].id] = arr[i];
  }
  return obj;
};

// Finds the closes node to current node
const findClosestNode = (node, visited, nodeObj) => {
  let shortestPath = Infinity;
  let index = 0;
  let nearestNodeId = 0;
  for (let i = 0; i < node.arrOfMinutes.length; i++) {
    const minutes = node.arrOfMinutes[i][1];
    const id = node.arrOfMinutes[i][0].split("to")[1];
    if (!visited.has(id) && minutes < shortestPath && nodeObj[id]) {
      shortestPath = minutes;
      index = i;
      nearestNodeId = id;
    }
  }
  if (nearestNodeId !== 0) visited.add(nearestNodeId);
  return node.arrOfMinutes[index];
};

// Uses greedy method to find the fastest route for each node that is not used in the route for another node
const getRoute = (node, nodeObj) => {
  const visited = new Set();
  const routeArr = [Number(node.id)];
  visited.add(node.id);
  let returnTime = node.minutesFromBase;
  let minutes = node.minutesFromStarting + node.minutesWithCargo + returnTime;
  while (minutes < TIME) {
    let closest = findClosestNode(node, visited, nodeObj);
    const id = closest[0].split("to")[1];
    if (nodeObj[id]) {
      const addMinutes =
        closest[1] +
        nodeObj[id].minutesWithCargo -
        returnTime +
        nodeObj[id].minutesFromBase;
      if (TIME > minutes + addMinutes) {
        minutes += addMinutes;
        routeArr.push(Number(id));
        node = nodeObj[id];
        returnTime = node.minutesFromBase;
      }
    }
    visited.add(id);
    if (visited.size >= Object.keys(nodeObj).length) {
      break;
    }
  }
  return routeArr;
};

// Deletes nodes used in route so they are not used again
const deleteUsedNodes = (routArr, nodeObj) => {
  for (let j = 0; j < routArr.length; j++) {
    delete nodeObj[routArr[j]];
  }
};

// Orchestator to find all routes
const getAllRoutes = (arr, nodeObj) => {
  const returnArr = [];
  for (let i = 0; i < arr.length; i++) {
    const node = arr[i];
    if (node.id in nodeObj) {
      const routArr = getRoute(node, nodeObj);
      deleteUsedNodes(routArr, nodeObj);
      returnArr.push(routArr);
    }
  }
  return returnArr;
};

const printRoute = (routes) => {
  for (let i = 0; i < routes.length; i++) {
    process.stdout.write(`[${routes[i].toString()}]\n`);
  }
};

// Read files from command line and run all methods
const fs = require("fs"),
  filename = process.argv[2];
fs.readFile(filename, "utf8", function (err, data) {
  if (err) throw err;
  const arr = createArrayOfObjects(data);
  arr.sort((a, b) => a.minutesFromStarting - b.minutesFromStarting);
  setEdges(arr);
  const nodeObj = setNodesIntoObj(arr);
  const routes = getAllRoutes(arr, nodeObj);
  printRoute(routes);
});
