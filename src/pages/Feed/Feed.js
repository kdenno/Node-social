import React, { Component, Fragment } from "react";
// import OpenSocket from "socket.io-client";

import Post from "../../components/Feed/Post/Post";
import Button from "../../components/Button/Button";
import FeedEdit from "../../components/Feed/FeedEdit/FeedEdit";
import Input from "../../components/Form/Input/Input";
import Paginator from "../../components/Paginator/Paginator";
import Loader from "../../components/Loader/Loader";
import ErrorHandler from "../../components/ErrorHandler/ErrorHandler";
import "./Feed.css";

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: "",
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    const graphqlQuery = {
      query: `{
        user {
          status
        }
      }`
    }
    fetch("http://localhost:8080/graphql", {
      method: 'POST',
      headers: {
        Authorization: "Bearer " + this.props.token,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if(resData.errors) {
          throw new Error('Failed to fetch status');
        }
        this.setState({ status: resData.user.status });
      })
      .catch(this.catchError);

    this.loadPosts();
    /*
    // open socket
    const socket = OpenSocket("http://localhost:8080"); // always use http coz its what socket.io binds to
    // listen to event triggered from the server
    socket.on("posts", data => {
      if (data.action === "create") {
        // update state
        this.addPost(data.post);
      } else if (data.action === "update") {
        this.updatePost(data.post);
      }
    });
    
    */
  }
  /*
  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      if (prevState.postPage === 1) {
        updatedPosts.pop();
        updatedPosts.unshift(post);
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    });
  };

  updatePost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      const updatedpostIndex = updatedPosts.findIndex(p => p.id === post._id);
      if (updatedpostIndex > -1) {
        updatedPosts[updatedpostIndex] = post;
      }
      return { posts: updatedPosts };
    });
  };
  */

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === "next") {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === "previous") {
      page--;
      this.setState({ postPage: page });
    }
    /*
    fetch("http://localhost:8080/feed/posts", {
      headers: {
        Authorization: "Bearer " + this.props.token
      }
    }) 
    */
    const graphqlQuery = {
      query: `{
     getPosts(page: ${page}) {
       posts {
         _id
         title
         content
         imageUrl
         creator{ name }
         createdAt
       }
       totalNumber
     }
   }`
    };
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.props.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error("Fetching Posts failed");
        }
        this.setState({
          posts: resData.data.getPosts.posts.map(post => {
            return {
              ...post,
              imagePath: post.imageUrl
            };
          }),
          totalPosts: resData.data.getPosts.posts.totalNumber,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    event.preventDefault();
    const graphqlQuery = {
      query: `{
        mutation {
          updateStatus(status: "${this.state.status}") {
            status
          }
        }
      }`
    }
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.props.token,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        
        return res.json();
      })
      .then(resData => {
        console.log(resData);
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    // Set up data (with image!)
    /*let url = "http://localhost:8080/feed/post";
    let method = "POST";
    if (this.state.editPost) {
      url = "http://localhost:8080/feed/post" + this.state.editPost._id;
      method = "PUT";
    }*/
    const formData = new FormData(); // browser formData object
    formData.append("image", postData.image);
    if (this.state.editPost) {
      formData.append("oldPath", this.state.editPost.imagePath);
    }

    /* fetch(url, {
      method: method,
      body: formData,
      headers: {
        Authorization: "Bearer " + this.props.token
      }
    }) */
    fetch("http://localhost:8080/post-image", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + this.props.token
      },
      body: formData
    })
      .then(res => res.json())
      .then(fileResData => {
        const imageUrl = fileResData.filePath;
        let graphqlQuery = {
          query: `{
          mutation: {
            createPost(postInput: {title: "${postData.title}", 
            content: "${postData.content}", imageUrl: "${imageUrl}"}) {_id
               title
              content
            creator { name }
          createdAt
        }
          }
        }`
        };
        if (this.state.editPost) {
          graphqlQuery = {
            query: `{
            mutation: {
              updatePost(id:"${this.state.editPost._id}", postInput: {title: "${postData.title}", 
              content: "${postData.content}", imageUrl: "${imageUrl}"}) {_id
                 title
                content
              creator { name }
            createdAt
          }
            }
          }`
          };
        }
        return fetch("http:localhost:8080/graphql", {
          method: "POST",
          body: JSON.stringify(graphqlQuery),
          headers: {
            Authorization: "Bearer " + this.props.token,
            "Content-Type": "Application/json"
          }
        });
      })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        let editAction = "createPost";
        if (this.state.editPost) {
          editAction = "updatePost";
        }
        const post = {
          _id: resData.data[editAction]._id,
          title: resData.data[editAction].title,
          content: resData.data[editAction].content,
          creator: resData.data[editAction].creator,
          createdAt: resData.data[editAction].createdAt,
          imageUrl: resData.data[editAction].imageUrl
        };
        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          if (prevState.editPost) {
            const postIndex = prevState.posts.findIndex(
              p => p._id === prevState.editPost._id
            );
            updatedPosts[postIndex] = post;
          } else {
            if (prevState.posts.length >= 2) {
              updatedPosts.pop();
            }
            updatedPosts.unshift(post);
          }
          return {
            posts: updatedPosts,
            isEditing: false,
            editPost: null,
            editLoading: false
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    /*fetch("http://localhost:8080/feed/post/" + postId, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + this.props.token
      }
    })*/
    const graphQuery = {
      query: `{
        mutation: {
          deletePost(id: "${postId}")
        }
      }`
    };
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.props.token,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        return res.json();
      })
      .then(resData => {
        if (resData.errors) {
          throw new Error("Deleting Post Failed");
        }
        this.setState(prevState => {
          const updatedPosts = prevState.posts.filter(p => p._id !== postId);
          return { posts: updatedPosts, postsLoading: false };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: "center" }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, "previous")}
              onNext={this.loadPosts.bind(this, "next")}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString("en-US")}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
