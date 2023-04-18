import './Session.css';
import React from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles'
import io from 'socket.io-client';
import { ButtonBase } from '@mui/material';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import ListItemButton from '@mui/material/ListItemButton';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import ReactMarkdown from 'react-markdown';
import remarkgfm from 'remark-gfm';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

function Session() {
  let [links, setLinks] = React.useState([]);
  let link1;
  let [currentElement, setCurrentElement] = React.useState(undefined);
  let [socket, setSocket] = React.useState(undefined);
  let [link, setLink] = React.useState({});
  let [tally, setTally] = React.useState({});
  let [selectedVote, setSelectedVote] = React.useState(undefined);
  let index;
  let [isList, setIsList] = React.useState(false);
  let [searchQuery, setSearchQuery] = React.useState("");

  function refresh() {
    axios.get("/refresh");
    socket.emit("refresh", {})
  }

  function getJiraCards() {
    axios.get("/jira").then((urlResponse) => {
      links = urlResponse.data;
      console.log(links);
      setLinks(links);
    });
  }

  React.useEffect(() => {
    let ioSocket = io.connect("ws://localhost:3000")
    setSocket(ioSocket);
    getJiraCards();
    ioSocket.on("standings", data => {
      setTally(data);
    });
    ioSocket.on("refresh", data => {
      getJiraCards();
    });
    ioSocket.on("changeCard", data => {
      index = data;
      link1 = links[index];
      link1.jiralink = "https://issues.redhat.com/browse/" + link1.key
      link1.description = link1.fields.description
      link1.summary = link1.fields.summary
      link = link1;
      setLink(link1);
    });
    ioSocket.on("deleteCard", data => {
      let newLinks = JSON.parse(JSON.stringify(links));
      newLinks.splice(index, 1);
      links = newLinks;
      setLinks(newLinks);
      link1 = newLinks[index];
      link1.jiralink = "https://issues.redhat.com/browse/" + link1.key
      link1.description = link1.fields.description
      link1.summary = link1.fields.summary
      setLink(link1);
    });
    ioSocket.on("showList", data => {
      setIsList(false);
    });
    ioSocket.on("skipCard", data => {
      let newLinks = JSON.parse(JSON.stringify(links));
      newLinks.splice(data, 1);
      links = newLinks;
      console.log("here")
      setLinks(newLinks);
    })
  }, []);

  let cards = [[0, "Spike"], [1, "XS"], [2, "S"], [3, "M"], [5, "L"], [8, "XL"], [13, "XXL"]];
  function vote(event) {
    if (currentElement != undefined) {
      currentElement.style.backgroundColor = '#1A2027';
    }
    setCurrentElement(event.currentTarget);
    event.target.style.backgroundColor = 'green';
    socket.emit("vote", { id: socket["id"], vote: event.target.value });
  }
  function nextPage(change) {
    if (socket != undefined) {
      socket.emit("card", index + 1);
    }
  }
  function prevPage(change) {
    if (socket != undefined) {
      socket.emit("card", index - 1);
    }
  }

  function selectValue(event) {
    if (selectedVote != undefined) {
      selectedVote.style.backgroundColor = '#1A2027';
    }
    setSelectedVote(event.currentTarget);
    event.target.style.backgroundColor = 'blue';
  }
  function submit() {
    // check if selectedVote first
    if (isList == false) {
      alert("Select a card first");
    }
    else if (selectedVote == undefined) {
      alert("Select a voted number to submit");
    } else {
      // change jira ticket story points to selectedVote.value
      // set selectedVote to undefined
      link.storyPoint = selectedVote.value;
      selectedVote.style.backgroundColor = '#1A2027';
      selectedVote = undefined;

      // reset tally in server
      socket.emit("submit", link);

      if (currentElement != undefined) {
        currentElement.style.backgroundColor = '#1A2027';
      }
      setCurrentElement(undefined);
      // splice card
      skip()
    }
  }
  function showCard(indexVal) {
    console.log(indexVal);
    socket.emit("card", indexVal);
    setIsList(true);
  }

  function skip() {
    socket.emit("deleteCard", {});
  }

  function skipCard(index) {
    socket.emit("skip", index);
  }

  function showList() {
    socket.emit("showList", {});
    setIsList(false);
  }

  function changeInput(event) {
    setSearchQuery(event.target.value);
  }

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: "2vh" }}>
        Scrum Poker
      </header>
      <header className="App-header">
        <Grid style={{ width: "70%", minHeight: "59vh", marginLeft: "1rem", marginRight: "1rem" }}>
          {isList ? <Card sx={{ minWidth: 275, backgroundColor: "#333", color: "white" }}>
            <CardContent>
              <CardActions>
                <Button size="small" onClick={showList}>Back</Button>
              </CardActions>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                <a style={{ fontSize: 28 }} href={link.jiralink}>{link.key}: {link.summary}</a>
              </Typography>
              <Typography sx={{ textAlign: "left", height: "59vh", maxHeight: "59vh", overflowY: "scroll" }} component="div">
                <ReactMarkdown remarkPlugins={[remarkgfm]}>{link.description}</ReactMarkdown>
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" disabled={index == 0} onClick={prevPage}>Prev</Button>
              <Button size="small" onClick={skip}>Skip</Button>
              <Button size="small" disabled={index == links.length} onClick={nextPage}>Next</Button>
            </CardActions>
          </Card> : <Card sx={{ minWidth: 275, backgroundColor: "#333", color: "white" }}>
            <div>
              <TextField id="standard-basic" defaultValue={searchQuery} onChange={(e) => changeInput(e)}
                label="Search" sx={{ label: { color: "#ccc" }, width: "50%" }} variant="standard" />
              <Button size="small" sx={{ marginLeft: "25em" }} onClick={refresh}>Refresh Cards</Button>
            </div>
            <List sx={{ textAlign: "left", height: "59vh", maxHeight: "59vh", overflowY: "scroll" }}>
              {links.filter(item => { let value = item.key + ": " + item.fields.summary; return value.toLowerCase().includes(searchQuery.toLowerCase()) }).map((item, tabInd) => {
                return <ListItem value={tabInd}>
                  <ListItemButton onClick={() => { sessionStorage.setItem('scrollPosition', window.pageYOffset); showCard(tabInd) }}
                    sx={{ width: "56em" }} component="a" value={tabInd}>
                    <ListItemText value={tabInd}>{item.key}: {item.fields.summary}</ListItemText>
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemText value={tabInd} onClick={() => { skipCard(tabInd) }}>Skip</ListItemText>
                  </ListItemButton>
                </ListItem>
              })}
            </List>
          </Card>}
        </Grid>
        <Grid container style={{ width: "30%", flexDirection: "row" }}>
          <Grid container>
            {cards.map(item => {
              return <Grid xs={1} md={4}>
                <ButtonBase disabled={!isList} style={{
                  backgroundColor: '#1A2027',
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#fff',
                  width: '70%',
                  height: '10rem',
                  margin: '1rem',
                  display: 'flex',
                  flexDirection: 'column'
                }} onClick={vote} value={item[0]}>
                  {item[0]}<br />
                  {item[1]}
                </ButtonBase>
              </Grid>
            })}
          </Grid>
          <Grid container>
            {Object.keys(tally).map(item => {
              return <Grid xs={1} md={4}>
                <ButtonBase style={{
                  backgroundColor: '#1A2027',
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#fff',
                  margin: '1rem',
                  display: 'flex',
                  flexDirection: 'column'
                }} onClick={selectValue} value={item}>
                  {item}: {tally[item]} votes
                </ButtonBase>
              </Grid>
            })}
          </Grid>
          <Grid container>
            <ButtonBase style={{
              backgroundColor: '#1A2027',
              padding: '1rem',
              textAlign: 'center',
              color: '#fff',
              margin: '1rem',
              display: 'flex',
              flexDirection: 'column'
            }} onClick={submit}>
              Submit
            </ButtonBase>
          </Grid>
        </Grid>
      </header>
    </div >
  );
}

export default Session;
