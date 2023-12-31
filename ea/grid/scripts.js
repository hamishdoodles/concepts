const colors = ["#38a8cc", "#004444", "#884444", "#555588", "#a84466"];

const pagesContainer = document.getElementById('pages');
const tilesContainer = document.getElementById('tiles');

function addCard(index, d, labelToSlug) {

  i = parseInt(d['Number'])-1
  title = d['Label']
  const color = colors[i % colors.length];

  const pageDiv = d3.select('#pages')
    .append('div');
  pageDiv
    .attr('id', d['slug'])
    .classed('page', true)
    .style("background-color", color);

  pageDiv.append('div')
    .classed('close-section', true)
    .html('&times')

  var description = insertCrossReferences(d['Description'], labelToSlug);
  console.log(description)
  pageDiv.append('div')
    .html(`${i+1} ${title}`)
    .append('p')
    .html(description)
    .style('max-width', '600px')

  if (d['Image URL'] != '') {
      pageDiv.append('img')
          .attr('src', window.location.origin + window.location.pathname + '../imgs/' + d['Image URL'])
          .attr('alt', d['Label'])
          .classed('image-container', true)
          .classed('breathe-image', true);
  }
  MathJax.typeset();

  const tileDiv = document.createElement('div');
  tileDiv.className = 'tile';
  tileDiv.style.backgroundColor = color;
  tileDiv.textContent = `${i+1} ${title}`;
  tilesContainer.appendChild(tileDiv);

  // Add click event to jump to corresponding element in Pages
  tileDiv.addEventListener('click', () => {
    const targetPage = pagesContainer.children[index];
    pagesContainer.scrollTo({ top: targetPage.offsetTop });
    pagesContainer.style.left = '0%'; // Move Pages to cover the screen
    setTimeout(function() {
      tilesContainer.classList.add('invisible');
    }, 1000);
  });
}


renderFromSpreadsheet("https://docs.google.com/spreadsheets/d/1FPOw1raQDn3xXmr2ejbYrUr8U_ZtxalJjB3pdNBvyUQ/export?format=csv&gid=0", "#data-container");

// Renders the glossary from the given CSV URL
function renderFromSpreadsheet(csvUrl, containerId) {
    d3.csv(csvUrl)
        .then(function(data) {
            console.table(data);
            var labelToSlug = createCrossReferenceMapping(data);
            buildGlossary(containerId, data, labelToSlug);
            d3.select("#loading").remove();
            activateScroll();
            scrollToAnchor();
            activateCloseButtons();
        })
        .catch(function(error) {
            console.log(error);
        });
}

// Creates a mapping like 'Concept 1' → '#concept-1' and 'Concept 1 alias' → '#concept-1'
function createCrossReferenceMapping(data) {
    var labelToSlug = {};
    data.forEach(function(d) {
		[d['Label']].concat(d['aka'].split(','))
		  .map(label => label.trim())  // Trimming each label
		  .filter(label => label !== '') // Filtering out empty strings
		  .forEach(label => {
			labelToSlug[label] = d['slug'];
		  });
    });
    return labelToSlug;
}

// Builds the entire glossary
function buildGlossary(containerId, data, labelToSlug) {
    var container = d3.select(containerId);
    var currentTable;

    data.forEach(function(d, i) {
        /*
        if (d['Topic'] !== '') {
            // currentTable = createTopicSection(container, d);
            addCard(d['Number'], d['Label'])
        }
        */
        addCard(i, d, labelToSlug)
    });
}

// Creates a new topic section
function createTopicSection(container, d) {
    var div = container.append('div').attr('id', d['slug']);
    div.append('img')
        .attr('src', window.location.origin + window.location.pathname + '/imgs/' + d['Image URL'])
        .attr('alt', d['Label'])
        .classed('image-container', true)
        .classed('breathe-image', true);
    div.append('h2')
        .text(d['Topic'])
        .classed('table-title', true);
    return div
}

// Replaces instances of "Concept 1" with "<a href='#concept-1'>Concept 1</a>"
function insertCrossReferences(description, labelToSlug) {
    Object.keys(labelToSlug).forEach(function(label) {
        var re = new RegExp('\\b' + escapeRegExp(label) + '\\b', 'gi'); // Match whole word, case-insensitive
        description = description.replace(re, '<a href="#' + labelToSlug[label] + '">' + label + '</a>');
    });
    return description;
}

// If the page was loaded with "url/#concept", then this will scroll to #concept
function scrollToAnchor() {
    let hash = window.location.hash;
    if (hash) {
        const element = document.querySelector(hash);
        if (element) {
        console.log(element, element.offsetTop)
            pagesContainer.style.left = '0%'; // Move Pages to cover the screen
            pagesContainer.scrollTo({ top: element.offsetTop, behavior: 'smooth' });
        }
    }
}

// Escapes special characters for use in a regular expression
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function activateScroll() {
  // Measure total scrollable heights
  const pagesScrollHeight = pagesContainer.scrollHeight - pagesContainer.clientHeight;
  const tilesScrollHeight = tilesContainer.scrollHeight - tilesContainer.clientHeight;
  const scrollFactor = tilesScrollHeight / pagesScrollHeight;
  
  // Sync scroll between pages and tiles
  pagesContainer.addEventListener('scroll', () => {
    tilesContainer.scrollTop = pagesContainer.scrollTop * scrollFactor;
  });
}

function activateCloseButtons() {
  document.querySelectorAll('.close-section').forEach((closeButton, index) => {
	closeButton.addEventListener('click', () => {
      tilesContainer.classList.remove('invisible');
	  const correspondingTile = tilesContainer.children[index];
	  pagesContainer.style.left = '100%'; // Move Pages off-screen to the right
	});
  });
}
