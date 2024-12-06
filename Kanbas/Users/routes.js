import * as dao from "./dao.js";
import * as courseDao from "../Courses/dao.js";
import * as enrollmentsDao from "../Enrollments/dao.js";

// let currentUser = null;
export default function UserRoutes(app) {
  const createUser = async (req, res) => {
    const user = await dao.createUser(req.body);
    res.json(user);
  };
  const deleteUser = (req, res) => { };
  const findAllUsers = async (req, res) => {
    const { role, name } = req.query;
    if (role) {
      const users = await dao.findUsersByRole(role);
      res.json(users);
      return;
    }

    if (name) {
      const users = await dao.findUsersByPartialName(name);
      res.json(users);
      return;
    }

    const users = await dao.findAllUsers();
    res.json(users);
  };
  const findUserById = async (req, res) => {
    const user = await dao.findUserById(req.params.userId);
    res.json(user);
  };


  const updateUser = async (req, res) => { 
    const userId = req.params.userId;
    const userUpdates = req.body;
    await dao.updateUser(userId, userUpdates);
    const currentUser = req.session["currentUser"];
    if (currentUser && currentUser._id === userId) {
      req.session["currentUser"] = { ...currentUser, ...userUpdates };
    } 
    // req.session["currentUser"] = currentUser;
    res.json(currentUser);
  };

  const signup = async (req, res) => { 
    const user = await dao.findUserByUsername(req.body.username);
    if (user) {
      res.status(400).json(
        { message: "Username already in use" });
      return;
    }
    const currentUser = await dao.createUser(req.body);
    req.session["currentUser"] = currentUser;
    res.json(currentUser);
  };

  const signin = async (req, res) => { 
    const { username, password } = req.body;
    const currentUser = await dao.findUserByCredentials(username, password);
    if (currentUser) {
      req.session["currentUser"] = currentUser;
      res.json(currentUser);
    }
    else{
      res.status(401).json({ message: "Unable to login. Try again later." });
    }
  };

  const signout = (req, res) => { 
    req.session.destroy();
    res.sendStatus(200);
   };

  const profile = (req, res) => { 
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }
    res.json(currentUser);  
  };

  const findCoursesForEnrolledUser = (req, res) => {
    let { userId } = req.params;
    if (userId === "current") {
      const currentUser = req.session["currentUser"];
      if (!currentUser) {
        res.sendStatus(401);
        return;
      }
      userId = currentUser._id;
    }
    const courses = courseDao.findCoursesForEnrolledUser(userId);
    res.json(courses);
  };
  app.get("/api/users/:userId/courses", findCoursesForEnrolledUser);

  const createCourse = (req, res) => {
    const currentUser = req.session["currentUser"];
    const newCourse = courseDao.createCourse(req.body);
    enrollmentsDao.enrollUserInCourse(currentUser._id, newCourse._id);
    res.json(newCourse);
  };
  app.post("/api/users/current/courses", createCourse);



  const enrollUserInCourse = (req, res) => {
    const { userId, courseId } = req.body;
    enrollmentsDao.enrollUserInCourse(userId, courseId);
    res.sendStatus(200);
  };
  app.post("/api/users/enroll", enrollUserInCourse);

  const unenrollUserFromCourse = (req, res) => {
      const { userId, courseId } = req.body;
      enrollmentsDao.unenrollUserFromCourse(userId, courseId);
      res.sendStatus(200);
  };
  app.post("/api/users/unenroll", unenrollUserFromCourse);

  const allCourses = (req, res) => {
      const courses = courseDao.findAllCourses();
      res.json(courses);
  };
  app.get("/api/users/courses", allCourses);

  const deleteCourse =  async (req, res) => {
    const status = await dao.deleteUser(req.params.userId);
    res.json(status);

  };
  app.delete("/api/users/courses", deleteCourse);

  const updateCourse = (req, res) => {
      const { courseId } = req.body;
      courseDao.updateCourse(courseId, req.body);
      res.sendStatus(200);
  };
  app.put("/api/users/courses", updateCourse);    

  const addCourse = (req, res) => {
      const newCourse = courseDao.createCourse(req.body);
      res.json(newCourse);
  };
  app.post("/api/users/courses", addCourse);




  app.post("/api/users", createUser);
  app.get("/api/users", findAllUsers);
  app.get("/api/users/:userId", findUserById);
  app.put("/api/users/:userId", updateUser);
  app.delete("/api/users/:userId", deleteUser);
  app.post("/api/users/signup", signup);
  app.post("/api/users/signin", signin);
  app.post("/api/users/signout", signout);
  app.post("/api/users/profile", profile);
}
