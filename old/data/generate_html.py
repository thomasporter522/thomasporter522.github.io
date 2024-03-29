import json

def process_project(project):
    item = "<p class=\"project\">"+ project["name"] 
    if len(project["link"].items()) > 1:
        item += "<br>"
    for key, value in project["link"].items():
        item += " <a href = \"" + value + "\">[" + key + "]</a>"
    item += "</p>"
    if "at" in project.keys():
        item += "<span class=\"with\">"+project["at"]+"</span>"
    if "description" in project.keys():
        description = "<div class = \"expdescription\" class=\"content\" style=\"display:none;\"><p>" + project["description"] + "</p></div>"
        item = "<div class=\"collapsible\">" + item + "</div>" + description
    return item

def process_experience(experience):
    item = "<p class=\"experience\">" + experience["name"] + "</p>"
    if "with" in experience.keys():
        item += "<span class=\"with\">" + experience["with"] + "</span> <br>"
    item += "<span class=\"date\">" + experience["date"] + "</span>"
    if "description" in experience.keys():
        description = "<div class = \"expdescription\" class=\"content\" style=\"display:none;\"><p>" + experience["description"] + "</p></div>"
        item = "<div class=\"collapsible\">" + item + "</div>" + description
    return item

def process_class(clas):
    subject_codes = {"cs" : "CS", "math" : "Math", "linguistics" : "Ling"}
    item = "<li class=\"collapsible\">" + subject_codes[clas["subject"]] + " " + str(clas["number"]) + ": " + clas["name"] + "</li>"
    skills = ""
    if len(clas["skills"]) > 0: skills = "<p class=\"skill\">" + ", ".join(clas["skills"]) + "</p>"
    description = "<div class=\"description\" class=\"content\" style=\"display:none;\"><p>" + clas["description"] + "</p>"+ skills + "</div>"
    return item + description

def get_classes(classes):
    rdict = {"cs" : [], "math": [], "linguistics": []}
    for clas in classes:
        rdict[clas["subject"]].append(process_class(clas))
    return rdict

def process_reading(reading):
    item = "<b><em>" + reading["title"] + "</em></b>"
    if "author" in reading.keys():
        item += "<br><p class=\"author\">" + reading["author"] + "</p>"
    return "<li>" + item + "</li>"

def generate(maintemplate, maindest, blogtemplate, blogdest):
    f = open(maintemplate, "r")
    result = f.read()
    f.close()

    f = open("data/content.json")
    content = json.load(f)
    f.close()

    for key, value in content["contact"].items():
        result = result.replace("#"+key, value)

    result = result.replace("#blurb", content["blurb"])

    experiences = content["experience"]
    result = result.replace("#experience", "".join([process_experience(experience) for experience in experiences]))
    
    f = open("data/blog.html", "r")
    blog = f.read()
    result = result.replace("#blog", blog)
    f.close()

    projects = content["projects"]
    result = result.replace("#projects", "".join([process_project(project) for project in projects]))

    for key, value in content["skills"].items():
        result = result.replace("#"+ key, "".join(["<li>"+val+"</li>" for val in value]))

    class_dict = get_classes(content["classes"])
    for key, value in class_dict.items():
        result = result.replace("#"+ key + "classes", "".join(value))

    readings = content["reading"]
    result = result.replace("#reading", "".join([process_reading(reading) for reading in readings]))
    f.close()

    f = open(maindest, "w+")
    f.write(result)
    f.close()

    # blog index
    
    f = open(blogtemplate, "r")
    result = f.read()
    f.close()

    f = open("data/blog.html", "r")
    blog = f.read()
    result = result.replace("#blog", blog)
    f.close()

    f = open(blogdest, "w+")
    f.write(result)
    f.close()

if __name__ == "__main__":
    generate("data/index_template.html", "index.html", "data/blog_template.html", "blog/index.html")