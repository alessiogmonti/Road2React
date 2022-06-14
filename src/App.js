import styles from './App.module.css';
import * as React from 'react';
import axios from 'axios';
import styled from 'styled-components'
import { ReactComponent as Check } from './check.svg';

const StyledContainer= styled.div `
  height: 100vw;
  padding: 20px;
  background: #83a4d4;
  background: linear-gradient(to left, @b6fbff, #83a4d4);
  color: #171212
`

const StyledHeadlinePrimary = styled.h1`
  font-size: 48px;
  font-weight: 300;
  letter-spacing: 2px;
`

const StyledItem = styled.li`
  display: flex;
  align-items: right;
  padding-bottom: 5px;
`

const StyledColumn = styled.span`
  padding: 0 5px;
  white-space: nowrap;
  align-items: right;
  overflow: hidden;
  text-overflow: ellipsis;
  a{
    color: inherit;
  }
  width: ${(props) => props.width}
`

const StyledButton = styled.button`
  background: transparent;
  border: 1px solid #171212;
  padding: 5px;
  cursor: pointer;

  transition: all 0.1s ease-in;

  &:hover{
    background: #171212;
    color: #ffffff;
    fill: #ffffff;
  }
`

const StyledButtonSmall = styled(StyledButton)`
  padding: 5px;
`;

const StyledButtonLarge = styled(StyledButton)`
  padding: 10px;
`

const StyledSearchForm = styled.form`
  padding: 10px 0 20px 0;
  display: flex;
  align-item: baseline;
`;

const StyledLabel = styled.label`
  border-top: 1px solid #171212;
  border-left: 1px solid #171212;
  padding-left: 5px;
  font-size: 24px;
`;

const StyledInput = styled.input`
  border: none;
  border-bottom: 1px solid #171212;
  background-color: transparent;
  font-size: 24px
`

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const storiesReducer = (state, action) => {
  switch (action.type){
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          (story) => action.payload.objectID !== story.objectID
        )
      }
    default:
      throw new Error();
  }
};

const useSemiPersistentState = (key, initialState) => { 
  const isMounted = React.useRef(false);
  
  const [value, setValue] = React.useState(     // these variables fetch data in localStorage
    localStorage.getItem(key) || initialState   // localStorage is a Javascript Property that 
  );                                            // stores data in the browser even after the window is closed. 
                                                // sessionStorage stores only while window is open.
  React.useEffect(() => {
    if(!isMounted.current){
      isMounted.current = true;
    } else {
      localStorage.setItem(key, value);           // we are creating a key/value pair (key is search input, value is data)
    }
  },[value, key])

  return [value, setValue];
}

const getSumComments = (stories) => {
  console.log('SumComments');
  return stories.data.reduce(
    (result, value) => result + value.num_comments,
    0
  )
}

const App = () => {
  console.log('init');
  const [searchTerm, setSearchTerm] = 
    useSemiPersistentState('search', 'React') //start with 'React' as variable, unless there was a previous search already stored

  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer, { data:[], isLoading: false, isError: false}); //store data in a state

  const handleFetchStories = React.useCallback(async () => {
    dispatchStories( { type: 'STORIES_FETCH_INIT'});
    
    try{
      const result = await axios.get(url);
      
      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({type: "STORIES_FETCH_FAILURE"})
    }
  }, [url])                                                                                                                //triggers when searchTerm variable changes

  React.useEffect( () => {
    console.log('fetchstories');
    handleFetchStories();
  }, [handleFetchStories]);
                                                                                                                          // useCallback changes when searchTerm changes, which calls useEffect because its data changed.

  const handleRemoveStory = React.useCallback((item) => { // to remove a list item, change the state
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  }, []);

  const handleSearchInput = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleSearchSubmit = () => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
  }

  console.log('B:App')

  const sumComments = React.useMemo( () => getSumComments(stories), [
    stories,]);

  return (
    <StyledContainer>
        <StyledHeadlinePrimary>
          My Hacker Stories with {sumComments} comments
        </StyledHeadlinePrimary>
        <SearchForm searchTerm={searchTerm} onSearchInput={handleSearchInput} onSearchSubmit={handleSearchSubmit}/>
                                                                                                                          {/* this label is the search bar. the initial value was set above 
                                                                                                                          and when changed it calls the search function */}
        <hr />
        {stories.isError && <p>Something went wrong ...</p>}
                                                                                                                          {/* true && element causes render. False && element does not render */}
        {stories.isLoading ? (<p> Loading ...</p>) 
        : (
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
        )}
                                                                                                                          {/* conditional operator : displays list when isLoading is false, 'loading...' when otherwise*/}
    </StyledContainer>
  );
}

// this is a jsx element that creates a custom UL component and maps each item 
// in the list passed to this function to a <List> component (other custom component).
const List = React.memo(({list, onRemoveItem}) => console.log('B:List') || (  
  <ul>
    {list.map((item) => (
      <Item key={item.objectID} 
            item = {item}
            onRemoveItem={onRemoveItem}/>
    ))}
  </ul>
))

// this is a custom list entry. 
// we pass a function to each list item that can remove it.
const Item = React.memo(({item, onRemoveItem}) => console.log(item.objectID) || (
    <StyledItem>
      <StyledColumn widt='40%'>
        <a href={item.url}>{item.title}</a>
      </StyledColumn>
      <StyledColumn width= '10%'> {item.author} </StyledColumn>
      <StyledColumn width= '10%'> {item.num_comments} </StyledColumn>
      <StyledColumn width= '10%'> {item.points} </StyledColumn>
      {/* <StyledColumn width= '10%'> {item.created_at.split("T",1)}</StyledColumn> */}
      <StyledColumn width= '10%'>
        <StyledButtonSmall type="button" 
                onClick={()=> console.log('dismissed') || onRemoveItem(item)}> 
          <Check height='18px' width="18px"/>
        </StyledButtonSmall>
      </StyledColumn>
    </StyledItem>
))

//easy way of logging is with || because the log always evaluates to false :)
const SearchForm = ({searchTerm, 
  onSearchInput, 
  onSearchSubmit}) => console.log('SearchForm') || (
  <StyledSearchForm onSubmit={onSearchSubmit} className={styles.searchForm}>
    <InputWithLabel id='search' value={searchTerm} isFocused onInputChange={onSearchInput}>
      <strong> Search: </strong>
    </InputWithLabel>
    <StyledButtonLarge type='submit' disabled={!searchTerm}
      className="button buttonLarge">
      Submit
    </StyledButtonLarge>
  </StyledSearchForm>
)

const InputWithLabel = ({ id, value, type='text', onInputChange, children, isFocused}) =>{
  console.log('inputwithlabel')
  const inputRef = React.useRef();
  React.useEffect(() => {
    if (isFocused && inputRef.current){ // isFocused is for pressing enter key to search
      inputRef.current.focus();
    }
  }, [isFocused]);
  return(<>
    <StyledLabel htmlFor={id}> {children} </StyledLabel>
    &nbsp;
    <StyledInput id={id}
          ref={inputRef} 
          type={type} 
          value={value} 
          autoFocus={isFocused}
          onChange={onInputChange} />
  </>)
}

export default App;
